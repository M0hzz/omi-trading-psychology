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
}

export interface MarketSentimentSummary {
  overall_sentiment: number;
  sector_sentiment: Record<string, number>;
  news_count: number;
  high_impact_count: number;
  trending_tickers: string[];
}

export class MarketIntelligenceService {
  private static storageKey = 'omi_market_intelligence';
  private static sentimentCacheKey = 'omi_market_sentiment_cache';
  
  // News API configuration
  private static newsApiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY;
  private static alphaVantageKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY;

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
    this.saveToStorage(news);
    return newNews;
  }

  static async getSentimentSummary(): Promise<MarketSentimentSummary> {
    const news = await this.list("-created_date", 50); // Last 50 articles
    
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

    return {
      overall_sentiment,
      sector_sentiment,
      news_count: news.length,
      high_impact_count: news.filter(item => item.impact_level === 'HIGH').length,
      trending_tickers
    };
  }

  // Fetch news from real APIs
  static async fetchLatestNews(): Promise<MarketIntelligence[]> {
    const news: MarketIntelligence[] = [];
    
    try {
      // Fetch from News API (financial news)
      if (this.newsApiKey) {
        const newsApiData = await this.fetchFromNewsAPI();
        news.push(...newsApiData);
      }

      // You can add more news sources here
      // const alphaVantageNews = await this.fetchFromAlphaVantage();
      // news.push(...alphaVantageNews);

    } catch (error) {
      console.error('Error fetching news:', error);
    }

    return news;
  }

  private static async fetchFromNewsAPI(): Promise<MarketIntelligence[]> {
    if (!this.newsApiKey) return [];

    const query = 'stock market OR trading OR finance OR economy';
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${this.newsApiKey}`;
    
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
        sentiment_score: this.analyzeSentiment(article.title + ' ' + (article.description || '')),
        tickers_mentioned: this.extractTickers(article.title + ' ' + (article.description || '')),
        sector: this.categorizeNewsContent(article.title + ' ' + (article.description || '')),
        impact_level: this.assessImpactLevel(article.title + ' ' + (article.description || '')),
        url: article.url,
        published_date: article.publishedAt,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('NewsAPI fetch error:', error);
      return [];
    }
  }

  // Simple sentiment analysis (you could integrate with a proper sentiment API)
  private static analyzeSentiment(text: string): number {
    const positiveWords = ['gains', 'rally', 'surge', 'growth', 'bullish', 'positive', 'strong', 'rise', 'increase', 'boost', 'optimistic', 'breakthrough'];
    const negativeWords = ['falls', 'decline', 'crash', 'bearish', 'negative', 'weak', 'drop', 'decrease', 'concern', 'worry', 'risk', 'uncertainty'];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 0.1;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 0.1;
    });
    
    return Math.max(-1, Math.min(1, score));
  }

  // Extract stock tickers from text
  private static extractTickers(text: string): string[] {
    const commonTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'SPY', 'QQQ', 'IWM', 'DIA', 'VIX'];
    const found: string[] = [];
    
    commonTickers.forEach(ticker => {
      if (text.toUpperCase().includes(ticker)) {
        found.push(ticker);
      }
    });
    
    return found;
  }

  // Categorize news content by sector
  private static categorizeNewsContent(text: string): MarketIntelligence['sector'] {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('tech') || lowerText.includes('ai') || lowerText.includes('software')) return 'Technology';
    if (lowerText.includes('health') || lowerText.includes('pharma') || lowerText.includes('medical')) return 'Healthcare';
    if (lowerText.includes('bank') || lowerText.includes('finance') || lowerText.includes('fed')) return 'Finance';
    if (lowerText.includes('energy') || lowerText.includes('oil') || lowerText.includes('gas')) return 'Energy';
    if (lowerText.includes('retail') || lowerText.includes('consumer')) return 'Consumer';
    if (lowerText.includes('manufacturing') || lowerText.includes('industrial')) return 'Industrial';
    if (lowerText.includes('real estate') || lowerText.includes('housing')) return 'Real Estate';
    
    return 'General';
  }

  // Assess impact level based on content
  private static assessImpactLevel(text: string): MarketIntelligence['impact_level'] {
    const lowerText = text.toLowerCase();
    const highImpactWords = ['fed', 'federal reserve', 'interest rate', 'inflation', 'gdp', 'earnings', 'crash', 'surge'];
    const mediumImpactWords = ['quarterly', 'analyst', 'outlook', 'guidance', 'merger'];
    
    for (const word of highImpactWords) {
      if (lowerText.includes(word)) return 'HIGH';
    }
    
    for (const word of mediumImpactWords) {
      if (lowerText.includes(word)) return 'MEDIUM';
    }
    
    return 'LOW';
  }

  private static isDataStale(news: MarketIntelligence[]): boolean {
    if (news.length === 0) return true;
    
    const latestNews = news[0];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    return !latestNews.created_date || new Date(latestNews.created_date) < oneHourAgo;
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
}