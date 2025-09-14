// src/entities/MarketIntelligence.ts
export interface MarketIntelligence {
  id?: string;
  source: string;
  headline: string;
  summary?: string;
  sentiment_score: number; // -1 to 1
  tickers_mentioned?: string[];
  sector: "Technology" | "Healthcare" | "Finance" | "Energy" | "Consumer" | "Industrial" | "Real Estate" | "Materials" | "Utilities" | "Communications" | "General";
  impact_level: "HIGH" | "MEDIUM" | "LOW";
  url?: string;
  published_date?: string;
  created_date?: string;
  updated_date?: string;
  author?: string;
  content?: string;
  relevance_score?: number;
}

export interface MarketSentimentSummary {
  overall_sentiment: number;
  sector_sentiment: Record<string, number>;
  news_count: number;
  high_impact_count: number;
  trending_tickers: string[];
  source_breakdown: Record<string, number>;
  top_authors: string[];
}

export interface NewsSource {
  name: string;
  baseUrl: string;
  enabled: boolean;
  lastFetch?: Date;
  articlesFetched?: number;
  reliability: number; // 0-1
  category: 'financial' | 'general' | 'crypto' | 'economic';
}

export class MarketIntelligenceService {
  private static storageKey = 'omi_market_intelligence';
  private static sentimentCacheKey = 'omi_market_sentiment_cache';
  private static MAX_NEWS_ITEMS = 200;
  private static CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  private static SCRAPE_INTERVAL = 30 * 60 * 1000; // 30 minutes between scrapes
  
  // News API configuration
  private static newsApiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY;
  private static alphaVantageKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY;
  private static polygonApiKey = process.env.NEXT_PUBLIC_POLYGON_API_KEY;
  private static finnhubApiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
  
  // News sources configuration
  private static newsSources: NewsSource[] = [
    {
      name: 'NewsAPI',
      baseUrl: 'https://newsapi.org',
      enabled: true,
      reliability: 0.9,
      category: 'financial'
    },
    {
      name: 'Alpha Vantage',
      baseUrl: 'https://www.alphavantage.co',
      enabled: true,
      reliability: 0.8,
      category: 'financial'
    },
    {
      name: 'Polygon.io',
      baseUrl: 'https://api.polygon.io',
      enabled: !!process.env.NEXT_PUBLIC_POLYGON_API_KEY,
      reliability: 0.95,
      category: 'financial'
    },
    {
      name: 'Finnhub',
      baseUrl: 'https://finnhub.io',
      enabled: !!process.env.NEXT_PUBLIC_FINNHUB_API_KEY,
      reliability: 0.85,
      category: 'financial'
    },
    {
      name: 'Bloomberg',
      baseUrl: 'https://www.bloomberg.com',
      enabled: true,
      reliability: 0.95,
      category: 'financial'
    },
    {
      name: 'Reuters',
      baseUrl: 'https://www.reuters.com',
      enabled: true,
      reliability: 0.9,
      category: 'financial'
    },
    {
      name: 'CNBC',
      baseUrl: 'https://www.cnbc.com',
      enabled: true,
      reliability: 0.85,
      category: 'financial'
    },
    {
      name: 'MarketWatch',
      baseUrl: 'https://www.marketwatch.com',
      enabled: true,
      reliability: 0.8,
      category: 'financial'
    },
    {
      name: 'Yahoo Finance',
      baseUrl: 'https://finance.yahoo.com',
      enabled: true,
      reliability: 0.75,
      category: 'financial'
    },
    {
      name: 'CoinDesk',
      baseUrl: 'https://www.coindesk.com',
      enabled: true,
      reliability: 0.8,
      category: 'crypto'
    }
  ];
  
  static async list(sort = "-created_date", limit?: number): Promise<MarketIntelligence[]> {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(this.storageKey) : null;
    let news: MarketIntelligence[] = stored ? JSON.parse(stored) : [];
    
    // If no stored data or data is old, fetch fresh data
    if (news.length === 0 || this.isDataStale(news)) {
      try {
        const freshNews = await this.fetchLatestNews();
        news = [...freshNews, ...this.getMockData()]; // Combine with mock data for demo
        this.saveToStorage(news);
      } catch (error) {
        console.warn('Failed to fetch fresh news, using mock data:', error);
        news = this.getMockData();
      }
    }
    
    // Sort news
    if (sort === "-created_date") {
      news.sort((a, b) => new Date(b.created_date!).getTime() - new Date(a.created_date!).getTime());
    } else if (sort === "-sentiment") {
      news.sort((a, b) => b.sentiment_score - a.sentiment_score);
    } else if (sort === "-impact") {
      const impactOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      news.sort((a, b) => impactOrder[b.impact_level] - impactOrder[a.impact_level]);
    } else if (sort === "-relevance") {
      news.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    }
    
    return limit ? news.slice(0, limit) : news;
  }
  
  static async create(data: Omit<MarketIntelligence, 'id' | 'created_date' | 'updated_date'>): Promise<MarketIntelligence> {
    const news = await this.list();
    const newNews: MarketIntelligence = {
      ...data,
      id: Date.now().toString(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    
    news.unshift(newNews);
    
    // Clean up old news if we exceed the maximum limit
    if (news.length > this.MAX_NEWS_ITEMS) {
      news.splice(this.MAX_NEWS_ITEMS);
    }
    
    this.saveToStorage(news);
    return newNews;
  }
  
  static async updateNews(): Promise<MarketIntelligence[]> {
    try {
      const freshNews = await this.fetchLatestNews();
      const existingNews = await this.list();
      
      // Remove duplicates based on headline and source
      const uniqueFreshNews = freshNews.filter(fresh => 
        !existingNews.some(existing => 
          existing.headline === fresh.headline && 
          existing.source === fresh.source
        )
      );
      
      // Combine fresh news with existing news
      const combinedNews = [...uniqueFreshNews, ...existingNews];
      
      // Clean up old news
      const cleanedNews = this.cleanupOldNews(combinedNews);
      
      this.saveToStorage(cleanedNews);
      return cleanedNews;
    } catch (error) {
      console.error('Error updating news:', error);
      return await this.list();
    }
  }
  
  static async deleteOldNews(daysOld: number = 7): Promise<number> {
    const news = await this.list();
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    const filteredNews = news.filter(item => 
      new Date(item.created_date!) > cutoffDate
    );
    
    const deletedCount = news.length - filteredNews.length;
    
    if (deletedCount > 0) {
      this.saveToStorage(filteredNews);
      console.log(`Deleted ${deletedCount} old news items`);
    }
    
    return deletedCount;
  }
  
  static async clearCache(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.sentimentCacheKey);
    }
  }
  
  static async getSentimentSummary(): Promise<MarketSentimentSummary> {
    const news = await this.list("-created_date", 50);
    
    const overall_sentiment = news.length > 0 
      ? news.reduce((sum, item) => sum + item.sentiment_score, 0) / news.length
      : 0;
      
    // Calculate sector sentiment
    const sectorSentiment: Record<string, number[]> = {};
    news.forEach(item => {
      if (!sectorSentiment[item.sector]) {
        sectorSentiment[item.sector] = [];
      }
      sectorSentiment[item.sector].push(item.sentiment_score);
    });
    
    const sector_sentiment: Record<string, number> = {};
    Object.entries(sectorSentiment).forEach(([sector, scores]) => {
      sector_sentiment[sector] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });
    
    // Get trending tickers
    const tickerCounts: Record<string, number> = {};
    news.forEach(item => {
      item.tickers_mentioned?.forEach(ticker => {
        tickerCounts[ticker] = (tickerCounts[ticker] || 0) + 1;
      });
    });
    
    const trending_tickers = Object.entries(tickerCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ticker]) => ticker);
    
    // Source breakdown
    const source_breakdown: Record<string, number> = {};
    news.forEach(item => {
      source_breakdown[item.source] = (source_breakdown[item.source] || 0) + 1;
    });
    
    // Top authors
    const authorCounts: Record<string, number> = {};
    news.forEach(item => {
      if (item.author) {
        authorCounts[item.author] = (authorCounts[item.author] || 0) + 1;
      }
    });
    
    const top_authors = Object.entries(authorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([author]) => author);
    
    return {
      overall_sentiment,
      sector_sentiment,
      news_count: news.length,
      high_impact_count: news.filter(item => item.impact_level === 'HIGH').length,
      trending_tickers,
      source_breakdown,
      top_authors
    };
  }
  
  // Fetch news from multiple sources
  static async fetchLatestNews(): Promise<MarketIntelligence[]> {
    const allNews: MarketIntelligence[] = [];
    const enabledSources = this.newsSources.filter(source => source.enabled);
    
    try {
      // Fetch from all enabled sources concurrently
      const fetchPromises = enabledSources.map(source => 
        this.fetchFromSource(source).catch(error => {
          console.error(`Error fetching from ${source.name}:`, error);
          return [];
        })
      );
      
      const results = await Promise.allSettled(fetchPromises);
      
      // Process successful results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          allNews.push(...result.value);
          // Update source stats
          enabledSources[index].articlesFetched = result.value.length;
          enabledSources[index].lastFetch = new Date();
        }
      });
      
      console.log(`Fetched ${allNews.length} articles from ${enabledSources.length} sources`);
      
      // Apply relevance scoring and deduplication
      return this.processAndDeduplicateNews(allNews);
      
    } catch (error) {
      console.error('Error fetching news from multiple sources:', error);
      return [];
    }
  }
  
  // Fetch from individual source
  private static async fetchFromSource(source: NewsSource): Promise<MarketIntelligence[]> {
    switch (source.name) {
      case 'NewsAPI':
        return this.fetchFromNewsAPI();
      case 'Alpha Vantage':
        return this.fetchFromAlphaVantage();
      case 'Polygon.io':
        return this.fetchFromPolygon();
      case 'Finnhub':
        return this.fetchFromFinnhub();
      case 'Bloomberg':
        return this.fetchFromBloomberg();
      case 'Reuters':
        return this.fetchFromReuters();
      case 'CNBC':
        return this.fetchFromCNBC();
      case 'MarketWatch':
        return this.fetchFromMarketWatch();
      case 'Yahoo Finance':
        return this.fetchFromYahooFinance();
      case 'CoinDesk':
        return this.fetchFromCoinDesk();
      default:
        return [];
    }
  }
  
  // News API Integration
  private static async fetchFromNewsAPI(): Promise<MarketIntelligence[]> {
    if (!this.newsApiKey) return [];
    
    const query = 'stock market OR trading OR finance OR economy OR business';
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=30&apiKey=${this.newsApiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(data.message || 'News API error');
      }
      
      return data.articles.map((article: any) => ({
        id: this.generateId(),
        source: article.source.name || 'News API',
        headline: article.title,
        summary: article.description || '',
        content: article.content || '',
        sentiment_score: this.analyzeSentiment(article.title + ' ' + (article.description || '')),
        tickers_mentioned: this.extractTickers(article.title + ' ' + (article.description || '')),
        sector: this.categorizeNewsContent(article.title + ' ' + (article.description || '')),
        impact_level: this.assessImpactLevel(article.title + ' ' + (article.description || '')),
        url: article.url,
        published_date: article.publishedAt,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        author: article.author,
        relevance_score: this.calculateRelevance(article.title, article.description)
      }));
    } catch (error) {
      console.error('NewsAPI fetch error:', error);
      return [];
    }
  }
  
  // Alpha Vantage Integration
  private static async fetchFromAlphaVantage(): Promise<MarketIntelligence[]> {
    if (!this.alphaVantageKey) return [];
    
    try {
      const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${this.alphaVantageKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.feed) {
        return data.feed.slice(0, 20).map((item: any) => ({
          id: this.generateId(),
          source: 'Alpha Vantage',
          headline: item.title,
          summary: item.summary,
          content: item.url ? `Read more: ${item.url}` : '',
          sentiment_score: item.overall_sentiment_score / 100, // Convert to -1 to 1 scale
          tickers_mentioned: item.tickers?.slice(0, 5) || [],
          sector: this.mapSector(item.topic),
          impact_level: this.mapImpact(item.relevance_score),
          url: item.url,
          published_date: item.time_published,
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
          relevance_score: item.relevance_score / 100
        }));
      }
    } catch (error) {
      console.error('Alpha Vantage fetch error:', error);
    }
    
    return [];
  }
  
  // Polygon.io Integration
  private static async fetchFromPolygon(): Promise<MarketIntelligence[]> {
    if (!this.polygonApiKey) return [];
    
    try {
      const url = `https://api.polygon.io/v2/reference/news?limit=20&apiKey=${this.polygonApiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results) {
        return data.results.map((item: any) => ({
          id: this.generateId(),
          source: 'Polygon.io',
          headline: item.title,
          summary: item.description,
          content: item.article_url ? `Read more: ${item.article_url}` : '',
          sentiment_score: this.analyzeSentiment(item.title + ' ' + (item.description || '')),
          tickers_mentioned: this.extractTickers(item.title + ' ' + (item.description || '')),
          sector: this.categorizeNewsContent(item.title + ' ' + (item.description || '')),
          impact_level: this.assessImpactLevel(item.title + ' ' + (item.description || '')),
          url: item.article_url,
          published_date: item.published_utc,
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
          author: item.author,
          relevance_score: this.calculateRelevance(item.title, item.description)
        }));
      }
    } catch (error) {
      console.error('Polygon.io fetch error:', error);
    }
    
    return [];
  }
  
  // Finnhub Integration
  private static async fetchFromFinnhub(): Promise<MarketIntelligence[]> {
    if (!this.finnhubApiKey) return [];
    
    try {
      const url = `https://finnhub.io/api/v1/news?category=general&token=${this.finnhubApiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      return data.slice(0, 20).map((item: any) => ({
        id: this.generateId(),
        source: 'Finnhub',
        headline: item.headline,
        summary: item.summary,
        content: item.url ? `Read more: ${item.url}` : '',
        sentiment_score: this.analyzeSentiment(item.headline + ' ' + (item.summary || '')),
        tickers_mentioned: this.extractTickers(item.headline + ' ' + (item.summary || '')),
        sector: this.categorizeNewsContent(item.headline + ' ' + (item.summary || '')),
        impact_level: this.assessImpactLevel(item.headline + ' ' + (item.summary || '')),
        url: item.url,
        published_date: item.datetime,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        relevance_score: this.calculateRelevance(item.headline, item.summary)
      }));
    } catch (error) {
      console.error('Finnhub fetch error:', error);
    }
    
    return [];
  }
  
  // Web Scraping for major news sites
  private static async fetchFromBloomberg(): Promise<MarketIntelligence[]> {
    try {
      // Note: This is a simplified example. In production, you'd use proper scraping libraries
      const response = await fetch('https://www.bloomberg.com/markets', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) return [];
      
      const html = await response.text();
      // Parse HTML and extract articles (simplified example)
      const articles = this.parseHTMLArticles(html, 'bloomberg.com');
      
      return articles.map(article => ({
        id: this.generateId(),
        source: 'Bloomberg',
        headline: article.title,
        summary: article.summary,
        sentiment_score: this.analyzeSentiment(article.title + ' ' + (article.summary || '')),
        tickers_mentioned: this.extractTickers(article.title + ' ' + (article.summary || '')),
        sector: this.categorizeNewsContent(article.title + ' ' + (article.summary || '')),
        impact_level: this.assessImpactLevel(article.title + ' ' + (article.summary || '')),
        url: article.url,
        published_date: article.date,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        relevance_score: this.calculateRelevance(article.title, article.summary)
      }));
    } catch (error) {
      console.error('Bloomberg scraping error:', error);
    }
    
    return [];
  }
  
  private static async fetchFromReuters(): Promise<MarketIntelligence[]> {
    try {
      const response = await fetch('https://www.reuters.com/markets/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) return [];
      
      const html = await response.text();
      const articles = this.parseHTMLArticles(html, 'reuters.com');
      
      return articles.map(article => ({
        id: this.generateId(),
        source: 'Reuters',
        headline: article.title,
        summary: article.summary,
        sentiment_score: this.analyzeSentiment(article.title + ' ' + (article.summary || '')),
        tickers_mentioned: this.extractTickers(article.title + ' ' + (article.summary || '')),
        sector: this.categorizeNewsContent(article.title + ' ' + (article.summary || '')),
        impact_level: this.assessImpactLevel(article.title + ' ' + (article.summary || '')),
        url: article.url,
        published_date: article.date,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        relevance_score: this.calculateRelevance(article.title, article.summary)
      }));
    } catch (error) {
      console.error('Reuters scraping error:', error);
    }
    
    return [];
  }
  
  private static async fetchFromCNBC(): Promise<MarketIntelligence[]> {
    try {
      const response = await fetch('https://www.cnbc.com/markets/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) return [];
      
      const html = await response.text();
      const articles = this.parseHTMLArticles(html, 'cnbc.com');
      
      return articles.map(article => ({
        id: this.generateId(),
        source: 'CNBC',
        headline: article.title,
        summary: article.summary,
        sentiment_score: this.analyzeSentiment(article.title + ' ' + (article.summary || '')),
        tickers_mentioned: this.extractTickers(article.title + ' ' + (article.summary || '')),
        sector: this.categorizeNewsContent(article.title + ' ' + (article.summary || '')),
        impact_level: this.assessImpactLevel(article.title + ' ' + (article.summary || '')),
        url: article.url,
        published_date: article.date,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        relevance_score: this.calculateRelevance(article.title, article.summary)
      }));
    } catch (error) {
      console.error('CNBC scraping error:', error);
    }
    
    return [];
  }
  
  private static async fetchFromMarketWatch(): Promise<MarketIntelligence[]> {
    try {
      const response = await fetch('https://www.marketwatch.com/investing/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) return [];
      
      const html = await response.text();
      const articles = this.parseHTMLArticles(html, 'marketwatch.com');
      
      return articles.map(article => ({
        id: this.generateId(),
        source: 'MarketWatch',
        headline: article.title,
        summary: article.summary,
        sentiment_score: this.analyzeSentiment(article.title + ' ' + (article.summary || '')),
        tickers_mentioned: this.extractTickers(article.title + ' ' + (article.summary || '')),
        sector: this.categorizeNewsContent(article.title + ' ' + (article.summary || '')),
        impact_level: this.assessImpactLevel(article.title + ' ' + (article.summary || '')),
        url: article.url,
        published_date: article.date,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        relevance_score: this.calculateRelevance(article.title, article.summary)
      }));
    } catch (error) {
      console.error('MarketWatch scraping error:', error);
    }
    
    return [];
  }
  
  private static async fetchFromYahooFinance(): Promise<MarketIntelligence[]> {
    try {
      const response = await fetch('https://finance.yahoo.com/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) return [];
      
      const html = await response.text();
      const articles = this.parseHTMLArticles(html, 'finance.yahoo.com');
      
      return articles.map(article => ({
        id: this.generateId(),
        source: 'Yahoo Finance',
        headline: article.title,
        summary: article.summary,
        sentiment_score: this.analyzeSentiment(article.title + ' ' + (article.summary || '')),
        tickers_mentioned: this.extractTickers(article.title + ' ' + (article.summary || '')),
        sector: this.categorizeNewsContent(article.title + ' ' + (article.summary || '')),
        impact_level: this.assessImpactLevel(article.title + ' ' + (article.summary || '')),
        url: article.url,
        published_date: article.date,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        relevance_score: this.calculateRelevance(article.title, article.summary)
      }));
    } catch (error) {
      console.error('Yahoo Finance scraping error:', error);
    }
    
    return [];
  }
  
  private static async fetchFromCoinDesk(): Promise<MarketIntelligence[]> {
    try {
      const response = await fetch('https://www.coindesk.com/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) return [];
      
      const html = await response.text();
      const articles = this.parseHTMLArticles(html, 'coindesk.com');
      
      return articles.map(article => ({
        id: this.generateId(),
        source: 'CoinDesk',
        headline: article.title,
        summary: article.summary,
        sentiment_score: this.analyzeSentiment(article.title + ' ' + (article.summary || '')),
        tickers_mentioned: this.extractTickers(article.title + ' ' + (article.summary || '')),
        sector: 'Cryptocurrency', // Override sector for crypto news
        impact_level: this.assessImpactLevel(article.title + ' ' + (article.summary || '')),
        url: article.url,
        published_date: article.date,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        relevance_score: this.calculateRelevance(article.title, article.summary)
      }));
    } catch (error) {
      console.error('CoinDesk scraping error:', error);
    }
    
    return [];
  }
  
  // Parse HTML articles (simplified example)
  private static parseHTMLArticles(html: string, domain: string): any[] {
    // This is a simplified HTML parser. In production, use a proper library like cheerio
    const articles = [];
    
    // Extract article titles and links based on domain-specific patterns
    if (domain === 'bloomberg.com') {
      const titleMatches = html.match(/<h3[^>]*><a[^>]*>([^<]+)<\/a><\/h3>/g) || [];
      const linkMatches = html.match(/<h3[^>]*><a href="([^"]+)"/g) || [];
      
      titleMatches.forEach((match, index) => {
        const title = match.replace(/<[^>]*>/g, '');
        const url = linkMatches[index]?.match(/href="([^"]+)"/)?.[1] || '';
        
        if (title && url) {
          articles.push({
            title,
            url: url.startsWith('http') ? url : `https://bloomberg.com${url}`,
            summary: '',
            date: new Date().toISOString()
          });
        }
      });
    }
    // Add more parsing logic for other domains...
    
    return articles.slice(0, 10); // Limit to 10 articles per source
  }
  
  // Enhanced sentiment analysis
  private static analyzeSentiment(text: string): number {
    const positiveWords = [
      'gains', 'rally', 'surge', 'growth', 'bullish', 'positive', 'strong', 'rise', 'increase', 
      'boost', 'optimistic', 'breakthrough', 'profit', 'success', 'advance', 'climb', 'soar',
      'boom', 'expand', 'flourish', 'thrive', 'rebound', 'recovery', 'upbeat', 'encouraging'
    ];
    
    const negativeWords = [
      'falls', 'decline', 'crash', 'bearish', 'negative', 'weak', 'drop', 'decrease', 'concern',
      'worry', 'risk', 'uncertainty', 'loss', 'fail', 'plunge', 'slump', 'downturn', 'recession',
      'crisis', 'emergency', 'warning', 'alert', 'volatile', 'turmoil', 'chaos', 'panic'
    ];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    // Count positive and negative words
    positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) score += matches.length * 0.1;
    });
    
    negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) score -= matches.length * 0.1;
    });
    
    // Consider context intensifiers
    const intensifiers = ['very', 'extremely', 'highly', 'significantly', 'dramatically'];
    intensifiers.forEach(intensifier => {
      if (lowerText.includes(intensifier)) {
        score *= 1.2; // Increase impact of sentiment
      }
    });
    
    return Math.max(-1, Math.min(1, score));
  }
  
  // Enhanced ticker extraction
  private static extractTickers(text: string): string[] {
    const commonTickers = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'SPY', 'QQQ', 'IWM', 'DIA', 
      'VIX', 'BTC', 'ETH', 'NFLX', 'AMD', 'INTC', 'CSCO', 'ADBE', 'CRM', 'ORCL', 'IBM',
      'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BLK', 'BRK.A', 'BRK.B', 'V', 'MA',
      'JNJ', 'PFE', 'UNH', 'MRK', 'ABT', 'ABBV', 'T', 'VZ', 'DIS', 'NFLX', 'CMCSA', 'NFLX'
    ];
    
    const found: string[] = [];
    const upperText = text.toUpperCase();
    
    commonTickers.forEach(ticker => {
      // Match whole word ticker
      const regex = new RegExp(`\\b${ticker}\\b`, 'i');
      if (regex.test(upperText)) {
        found.push(ticker);
      }
    });
    
    return found;
  }
  
  // Enhanced content categorization
  private static categorizeNewsContent(text: string): MarketIntelligence['sector'] {
    const lowerText = text.toLowerCase();
    
    const sectorKeywords = {
      'Technology': ['tech', 'ai', 'software', 'hardware', 'computer', 'digital', 'cloud', 'cybersecurity', 'blockchain'],
      'Healthcare': ['health', 'medical', 'pharma', 'biotech', 'drug', 'hospital', 'patient', 'clinical'],
      'Finance': ['bank', 'finance', 'investment', 'trading', 'market', 'economy', 'federal reserve', 'interest rate'],
      'Energy': ['energy', 'oil', 'gas', 'solar', 'wind', 'renewable', 'electric', 'power'],
      'Consumer': ['retail', 'consumer', 'shopping', 'e-commerce', 'brand', 'product'],
      'Industrial': ['manufacturing', 'industrial', 'factory', 'supply chain', 'logistics'],
      'Real Estate': ['real estate', 'property', 'housing', 'construction', 'mortgage'],
      'Materials': ['materials', 'mining', 'commodity', 'chemical', 'steel'],
      'Utilities': ['utilities', 'water', 'waste', 'electric utility'],
      'Communications': ['communication', 'media', 'entertainment', 'telecom'],
      'Cryptocurrency': ['bitcoin', 'crypto', 'blockchain', 'defi', 'nft', 'web3']
    };
    
    let maxScore = 0;
    let bestSector = 'General';
    
    Object.entries(sectorKeywords).forEach(([sector, keywords]) => {
      const score = keywords.reduce((acc, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = lowerText.match(regex);
        return acc + (matches ? matches.length : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        bestSector = sector;
      }
    });
    
    return bestSector as MarketIntelligence['sector'];
  }
  
  // Enhanced impact assessment
  private static assessImpactLevel(text: string): MarketIntelligence['impact_level'] {
    const lowerText = text.toLowerCase();
    
    const highImpactWords = [
      'fed', 'federal reserve', 'interest rate', 'inflation', 'gdp', 'earnings', 'crash', 'surge',
      'recession', 'depression', 'market crash', 'financial crisis', 'bankruptcy', 'merger',
      'acquisition', 'takeover', 'ipo', 'dividend', 'split', 'regulation', 'policy'
    ];
    
    const mediumImpactWords = [
      'quarterly', 'analyst', 'outlook', 'guidance', 'merger', 'acquisition', 'earnings call',
      'dividend', 'split', 'regulation', 'policy', 'economic data', 'employment'
    ];
    
    const highScore = highImpactWords.reduce((score, word) => {
      return score + (lowerText.includes(word) ? 1 : 0);
    }, 0);
    
    const mediumScore = mediumImpactWords.reduce((score, word) => {
      return score + (lowerText.includes(word) ? 1 : 0);
    }, 0);
    
    if (highScore >= 2) return 'HIGH';
    if (highScore >= 1 || mediumScore >= 2) return 'MEDIUM';
    return 'LOW';
  }
  
  // Calculate relevance score
  private static calculateRelevance(title: string, summary: string): number {
    const text = (title + ' ' + (summary || '')).toLowerCase();
    const marketKeywords = ['market', 'stock', 'trading', 'finance', 'economy', 'business', 'invest'];
    
    let relevance = 0;
    marketKeywords.forEach(keyword => {
      if (text.includes(keyword)) relevance += 0.2;
    });
    
    // Boost relevance for titles with numbers (often indicates specific news)
    if (/\d+/.test(title)) relevance += 0.1;
    
    return Math.min(1, relevance);
  }
  
  // Map sectors from external sources
  private static mapSector(topic: string): MarketIntelligence['sector'] {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('technology') || topicLower.includes('tech')) return 'Technology';
    if (topicLower.includes('health') || topicLower.includes('medical')) return 'Healthcare';
    if (topicLower.includes('finance') || topicLower.includes('banking')) return 'Finance';
    if (topicLower.includes('energy')) return 'Energy';
    if (topicLower.includes('consumer')) return 'Consumer';
    if (topicLower.includes('industrial')) return 'Industrial';
    if (topicLower.includes('real estate')) return 'Real Estate';
    
    return 'General';
  }
  
  // Map impact scores from external sources
  private static mapImpact(relevanceScore: number): MarketIntelligence['impact_level'] {
    if (relevanceScore >= 0.8) return 'HIGH';
    if (relevanceScore >= 0.5) return 'MEDIUM';
    return 'LOW';
  }
  
  // Process and deduplicate news
  private static processAndDeduplicateNews(news: MarketIntelligence[]): MarketIntelligence[] {
    // Sort by relevance score (highest first)
    news.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    
    // Remove duplicates based on similarity
    const uniqueNews: MarketIntelligence[] = [];
    const seenTitles = new Set();
    
    news.forEach(article => {
      // Simple title-based deduplication
      const titleKey = article.headline.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (!seenTitles.has(titleKey)) {
        seenTitles.add(titleKey);
        uniqueNews.push(article);
      }
    });
    
    return uniqueNews.slice(0, this.MAX_NEWS_ITEMS);
  }
  
  private static isDataStale(news: MarketIntelligence[]): boolean {
    if (news.length === 0) return true;
    
    const latestNews = news[0];
    const staleTime = new Date(Date.now() - this.CACHE_DURATION);
    
    return !latestNews.created_date || new Date(latestNews.created_date) < staleTime;
  }
  
  private static cleanupOldNews(news: MarketIntelligence[]): MarketIntelligence[] {
    // Sort by date (newest first)
    news.sort((a, b) => new Date(b.created_date!).getTime() - new Date(a.created_date!).getTime());
    
    // Keep only the most recent MAX_NEWS_ITEMS
    return news.slice(0, this.MAX_NEWS_ITEMS);
  }
  
  private static saveToStorage(news: MarketIntelligence[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(news));
    }
  }
  
  private static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
  
  private static getMockData(): MarketIntelligence[] {
    const now = new Date();
    
    return [
      {
        id: "1",
        source: "MarketWatch",
        headline: "Federal Reserve Signals Potential Rate Cuts Ahead as Inflation Cools",
        summary: "Fed officials indicate a shift toward more accommodative monetary policy as inflation metrics show continued decline toward the 2% target.",
        sentiment_score: 0.7,
        tickers_mentioned: ["SPY", "QQQ", "TLT"],
        sector: "Finance",
        impact_level: "HIGH",
        url: "https://example.com/fed-rate-cuts",
        created_date: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "2",
        source: "CNBC",
        headline: "Tech Stocks Rally on AI Infrastructure Spending Surge",
        summary: "Major technology companies report record capital expenditures on AI infrastructure, driving sector-wide optimism among investors.",
        sentiment_score: 0.8,
        tickers_mentioned: ["NVDA", "GOOGL", "MSFT", "AMZN"],
        sector: "Technology",
        impact_level: "HIGH",
        url: "https://example.com/tech-ai-rally",
        created_date: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "3",
        source: "Bloomberg",
        headline: "Energy Sector Faces Headwinds Amid Renewable Transition",
        summary: "Traditional energy companies grapple with declining fossil fuel demand as renewable energy adoption accelerates globally.",
        sentiment_score: -0.4,
        tickers_mentioned: ["XOM", "CVX", "COP"],
        sector: "Energy",
        impact_level: "MEDIUM",
        url: "https://example.com/energy-headwinds",
        created_date: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "4",
        source: "Reuters",
        headline: "Healthcare Innovation Drives Sector Growth Despite Regulatory Concerns",
        summary: "Breakthrough treatments and medical technologies fuel healthcare sector expansion, though regulatory oversight remains a key risk factor.",
        sentiment_score: 0.5,
        tickers_mentioned: ["JNJ", "PFE", "UNH", "MRNA"],
        sector: "Healthcare",
        impact_level: "MEDIUM",
        url: "https://example.com/healthcare-growth",
        created_date: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "5",
        source: "Financial Times",
        headline: "Consumer Spending Shows Resilience Despite Economic Uncertainty",
        summary: "Retail sales data indicates sustained consumer demand across key categories, supporting economic growth expectations.",
        sentiment_score: 0.6,
        tickers_mentioned: ["WMT", "AMZN", "TGT", "COST"],
        sector: "Consumer",
        impact_level: "MEDIUM",
        url: "https://example.com/consumer-resilience",
        created_date: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "6",
        source: "Wall Street Journal",
        headline: "Manufacturing Sector Contracts for Third Consecutive Month",
        summary: "Industrial production declines as global supply chain disruptions and reduced demand impact manufacturing output.",
        sentiment_score: -0.3,
        tickers_mentioned: ["CAT", "GE", "BA", "MMM"],
        sector: "Industrial",
        impact_level: "MEDIUM",
        url: "https://example.com/manufacturing-contraction",
        created_date: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      }
    ];
  }
  
  // Additional utility methods
  static getNewsSources(): NewsSource[] {
    return [...this.newsSources];
  }
  
  static async enableSource(sourceName: string): Promise<void> {
    const source = this.newsSources.find(s => s.name === sourceName);
    if (source) {
      source.enabled = true;
    }
  }
  
  static async disableSource(sourceName: string): Promise<void> {
    const source = this.newsSources.find(s => s.name === sourceName);
    if (source) {
      source.enabled = false;
    }
  }
  
  static getSourceStats(): Record<string, any> {
    return this.newsSources.reduce((acc, source) => {
      acc[source.name] = {
        enabled: source.enabled,
        reliability: source.reliability,
        lastFetch: source.lastFetch,
        articlesFetched: source.articlesFetched,
        category: source.category
      };
      return acc;
    }, {} as Record<string, any>);
  }
}