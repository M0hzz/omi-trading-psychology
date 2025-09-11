export interface MarketIntelligence {
  id?: string;
  source: string;
  headline: string;
  summary?: string;
  sentiment_score: number; // -1 to 1
  tickers_mentioned?: string[];
  sector: "Technology" | "Healthcare" | "Finance" | "Energy" | "Consumer" | "Industrial" | "Real Estate" | "Materials" | "Utilities" | "Communications";
  impact_level: "HIGH" | "MEDIUM" | "LOW";
  url?: string;
  created_date?: string;
  updated_date?: string;
}

export class MarketIntelligenceService {
  private static storageKey = 'omi_market_intelligence';

  static async list(sort = "-created_date", limit?: number): Promise<MarketIntelligence[]> {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(this.storageKey) : null;
    let news: MarketIntelligence[] = stored ? JSON.parse(stored) : this.getMockData();
    
    // Sort news
    if (sort === "-created_date") {
      news.sort((a, b) => new Date(b.created_date!).getTime() - new Date(a.created_date!).getTime());
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
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(news));
    }
    return newNews;
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
        sentiment_score: -0.6,
        tickers_mentioned: ["CAT", "GE", "BA", "MMM"],
        sector: "Industrial",
        impact_level: "HIGH",
        url: "https://example.com/manufacturing-decline",
        created_date: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "7",
        source: "Yahoo Finance",
        headline: "Real Estate Market Shows Signs of Stabilization",
        summary: "Housing market data suggests bottoming out of the correction cycle, with mortgage rates showing modest decline.",
        sentiment_score: 0.3,
        tickers_mentioned: ["VNQ", "REZ", "IYR"],
        sector: "Real Estate",
        impact_level: "LOW",
        url: "https://example.com/real-estate-stabilization",
        created_date: new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "8",
        source: "MarketWatch",
        headline: "Cryptocurrency Market Volatility Continues Amid Regulatory Clarity",
        summary: "Digital asset prices experience sharp swings as investors await clearer regulatory frameworks from major economies.",
        sentiment_score: -0.2,
        tickers_mentioned: ["BTC", "ETH", "COIN"],
        sector: "Finance",
        impact_level: "MEDIUM",
        url: "https://example.com/crypto-volatility",
        created_date: new Date(now.getTime() - 16 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "9",
        source: "CNBC",
        headline: "Utilities Sector Benefits from Infrastructure Investment Surge",
        summary: "Power companies see increased investment opportunities as grid modernization and renewable energy projects accelerate nationwide.",
        sentiment_score: 0.4,
        tickers_mentioned: ["NEE", "DUK", "SO", "AEP"],
        sector: "Utilities",
        impact_level: "LOW",
        url: "https://example.com/utilities-infrastructure",
        created_date: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "10",
        source: "Bloomberg",
        headline: "Global Supply Chain Disruptions Impact Materials Pricing",
        summary: "Raw material costs surge as geopolitical tensions and weather events disrupt key supply routes, affecting manufacturing costs.",
        sentiment_score: -0.5,
        tickers_mentioned: ["FCX", "NEM", "AA", "X"],
        sector: "Materials",
        impact_level: "HIGH",
        url: "https://example.com/materials-supply-chain",
        created_date: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
      }
    ];
  }
}