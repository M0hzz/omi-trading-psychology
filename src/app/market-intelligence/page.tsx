"use client"

import React, { useState, useEffect } from "react";
import { MarketIntelligenceService, type MarketIntelligence } from "@/entities/MarketIntelligence";
import { TrendingUp, TrendingDown, Minus, ExternalLink, Newspaper, Filter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MarketIntelligencePage() {
  const [news, setNews] = useState<MarketIntelligence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    sector: "all",
    impact: "all",
    sentiment: "all",
    source: "all"
  });

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setIsLoading(true);
    try {
      const newsItems = await MarketIntelligenceService.list("-created_date");
      setNews(newsItems);
    } catch (error) {
      console.error("Error loading market intelligence:", error);
    }
    setIsLoading(false);
  };

  const filteredNews = news.filter(item => {
    return (
      (filters.sector === "all" || item.sector === filters.sector) &&
      (filters.impact === "all" || item.impact_level === filters.impact) &&
      (filters.source === "all" || item.source === filters.source) &&
      (filters.sentiment === "all" || 
        (filters.sentiment === "positive" && item.sentiment_score > 0.3) ||
        (filters.sentiment === "negative" && item.sentiment_score < -0.3) ||
        (filters.sentiment === "neutral" && item.sentiment_score >= -0.3 && item.sentiment_score <= 0.3)
      )
    );
  });

  const getSentimentIcon = (score: number) => {
    if (score > 0.3) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (score < -0.3) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-yellow-400" />;
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (score < -0.3) return "bg-red-500/20 text-red-400 border-red-500/30";
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return "Positive";
    if (score < -0.3) return "Negative";
    return "Neutral";
  };
  
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "HIGH": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "MEDIUM": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-green-500/20 text-green-400 border-green-500/30";
    }
  };

  const getSectorColor = (sector: string) => {
    const colors: Record<string, string> = {
      "Technology": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "Healthcare": "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "Finance": "bg-green-500/20 text-green-400 border-green-500/30",
      "Energy": "bg-orange-500/20 text-orange-400 border-orange-500/30",
      "Consumer": "bg-pink-500/20 text-pink-400 border-pink-500/30",
      "Industrial": "bg-gray-500/20 text-gray-400 border-gray-500/30",
      "Real Estate": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      "Materials": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      "Utilities": "bg-teal-500/20 text-teal-400 border-teal-500/30",
      "Communications": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
    };
    return colors[sector] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  // Get unique values for filters
  const uniqueSectors = [...new Set(news.map(item => item.sector))];
  const uniqueSources = [...new Set(news.map(item => item.source))];
  const impacts = ["all", "HIGH", "MEDIUM", "LOW"];
  const sentiments = ["all", "positive", "neutral", "negative"];

  // Calculate sentiment stats
  const avgSentiment = news.length > 0 ? news.reduce((sum, n) => sum + n.sentiment_score, 0) / news.length : 0;
  const positiveNews = news.filter(n => n.sentiment_score > 0.3).length;
  const negativeNews = news.filter(n => n.sentiment_score < -0.3).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Market Intelligence</h1>
            <p className="text-slate-400">24/7 news monitoring and real-time sentiment analysis</p>
          </div>
        </div>

        {/* Sentiment Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Market Sentiment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getSentimentIcon(avgSentiment)}
                <span className={`text-lg font-bold ${avgSentiment > 0.3 ? 'text-green-400' : avgSentiment < -0.3 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {avgSentiment > 0 ? '+' : ''}{(avgSentiment * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-slate-500">Average sentiment score</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Positive News</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{positiveNews}</div>
              <p className="text-xs text-slate-500">{Math.round((positiveNews / news.length) * 100)}% of articles</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Negative News</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{negativeNews}</div>
              <p className="text-xs text-slate-500">{Math.round((negativeNews / news.length) * 100)}% of articles</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Total Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{news.length}</div>
              <p className="text-xs text-slate-500">Past 24 hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm mb-8">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-center">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Filter className="w-5 h-5" />
                <span>Filters</span>
              </div>
              
              <select 
                value={filters.sector}
                onChange={(e) => setFilters(prev => ({ ...prev, sector: e.target.value }))}
                className="bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Sectors</option>
                {uniqueSectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>

              <select 
                value={filters.impact}
                onChange={(e) => setFilters(prev => ({ ...prev, impact: e.target.value }))}
                className="bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 text-sm"
              >
                {impacts.map(impact => (
                  <option key={impact} value={impact}>
                    {impact === "all" ? "All Impact" : `${impact} Impact`}
                  </option>
                ))}
              </select>

              <select 
                value={filters.sentiment}
                onChange={(e) => setFilters(prev => ({ ...prev, sentiment: e.target.value }))}
                className="bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 text-sm"
              >
                {sentiments.map(sentiment => (
                  <option key={sentiment} value={sentiment}>
                    {sentiment === "all" ? "All Sentiment" : `${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} News`}
                  </option>
                ))}
              </select>

              <select 
                value={filters.source}
                onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                className="bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Sources</option>
                {uniqueSources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>

              <div className="text-sm text-slate-400">
                {filteredNews.length} articles
              </div>
            </div>
          </CardContent>
        </Card>

        {/* News Feed */}
        <div className="flex items-center gap-2 text-xl font-bold text-white mb-4">
          <Newspaper className="w-6 h-6 text-blue-400" />
          <h2>News Feed ({filteredNews.length} articles)</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="bg-slate-900/50 border-slate-700/50 animate-pulse">
                <CardContent className="p-4 space-y-3">
                  <div className="h-5 bg-slate-800 rounded w-full"></div>
                  <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-slate-800 rounded w-20"></div>
                    <div className="h-6 bg-slate-800 rounded w-16"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredNews.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-700/50 text-center py-10">
            <Newspaper className="w-12 h-12 mx-auto text-slate-500 mb-4"/>
            <h3 className="text-lg font-semibold text-white">No News Found</h3>
            <p className="text-slate-400">Try adjusting your filters or check back later.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((item) => (
              <Card key={item.id} className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-blue-500/50 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-white leading-tight flex-1 text-sm">
                      {item.headline}
                    </h3>
                    {item.url && (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  
                  {item.summary && (
                    <p className="text-slate-400 text-xs mb-3 leading-relaxed">{item.summary}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={getSentimentColor(item.sentiment_score)}>
                      {getSentimentIcon(item.sentiment_score)}
                      {getSentimentLabel(item.sentiment_score)}
                    </Badge>
                    <Badge className={getImpactColor(item.impact_level)}>
                      {item.impact_level} Impact
                    </Badge>
                    <Badge className={getSectorColor(item.sector)}>
                      {item.sector}
                    </Badge>
                  </div>
                  
                  {item.tickers_mentioned && item.tickers_mentioned.length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs text-slate-500">Tickers: </span>
                      {item.tickers_mentioned.slice(0, 4).map(ticker => (
                        <Badge key={ticker} variant="secondary" className="mr-1 text-xs">
                          {ticker}
                        </Badge>
                      ))}
                      {item.tickers_mentioned.length > 4 && (
                        <span className="text-xs text-slate-500">+{item.tickers_mentioned.length - 4} more</span>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-500 flex justify-between">
                    <span>{item.source}</span>
                    <span>{new Date(item.created_date!).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}