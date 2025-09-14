// src/components/MarketIntelligencePage.tsx
"use client"
import React, { useState, useEffect } from "react";
import { MarketIntelligenceService, type MarketIntelligence, type MarketSentimentSummary, type NewsSource } from "@/entities/MarketIntelligence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Newspaper, 
  Filter, 
  RefreshCw, 
  BarChart3,
  AlertCircle,
  ExternalLink,
  Clock,
  X,
  Check,
  Settings,
  Globe,
  Database,
  Activity,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MarketIntelligencePage() {
  const [news, setNews] = useState<MarketIntelligence[]>([]);
  const [sentimentSummary, setSentimentSummary] = useState<MarketSentimentSummary | null>(null);
  const [newsSources, setNewsSources] = useState<NewsSource[]>([]);
  const [sourceStats, setSourceStats] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSourceSettings, setShowSourceSettings] = useState(false);
  const [filters, setFilters] = useState({
    sector: "all",
    impact: "all",
    sentiment: "all",
    source: "all"
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);

  useEffect(() => {
    loadMarketData();
    loadSourceData();
    
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        loadMarketData();
      }, refreshInterval * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const loadMarketData = async () => {
    setIsLoading(true);
    try {
      await MarketIntelligenceService.updateNews();
      
      const [newsItems, summary, stats] = await Promise.all([
        MarketIntelligenceService.list("-created_date"),
        MarketIntelligenceService.getSentimentSummary(),
        MarketIntelligenceService.getSourceStats()
      ]);
      
      setNews(newsItems);
      setSentimentSummary(summary);
      setSourceStats(stats);
    } catch (error) {
      console.error("Error loading market intelligence:", error);
    }
    setIsLoading(false);
  };

  const loadSourceData = async () => {
    const sources = MarketIntelligenceService.getNewsSources();
    setNewsSources(sources);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMarketData();
    setIsRefreshing(false);
  };

  const toggleSource = async (sourceName: string) => {
    const source = newsSources.find(s => s.name === sourceName);
    if (source) {
      const newEnabledState = !source.enabled;
      
      if (newEnabledState) {
        await MarketIntelligenceService.enableSource(sourceName);
      } else {
        await MarketIntelligenceService.disableSource(sourceName);
      }
      
      await loadSourceData();
      await loadMarketData();
    }
  };

  const clearFilters = () => {
    setFilters({
      sector: "all",
      impact: "all",
      sentiment: "all",
      source: "all"
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "all");

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

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return "text-green-400";
    if (score < -0.3) return "text-red-400";
    return "text-yellow-400";
  };

  const getSentimentBadgeColor = (score: number) => {
    if (score > 0.3) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (score < -0.3) return "bg-red-500/20 text-red-400 border-red-500/30";
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  };

  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case "HIGH": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "MEDIUM": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "LOW": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getSourceReliabilityColor = (reliability: number) => {
    if (reliability >= 0.9) return "text-green-400";
    if (reliability >= 0.7) return "text-yellow-400";
    return "text-red-400";
  };

  const uniqueSectors = [...new Set(news.map(item => item.sector))];
  const uniqueSources = [...new Set(news.map(item => item.source))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Market Intelligence</h1>
              <p className="text-slate-400">Real-time market sentiment and psychology insights from multiple sources</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSourceSettings(!showSourceSettings)}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Sources
            </Button>
            <Button
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              {autoRefresh ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Auto Refresh On
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Auto Refresh Off
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Source Settings Panel */}
        {showSourceSettings && (
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                News Sources Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {newsSources.map(source => (
                  <div key={source.name} className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${source.enabled ? 'bg-green-400' : 'bg-slate-600'}`} />
                        <span className="text-white font-medium">{source.name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSource(source.name)}
                        className={source.enabled ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-slate-800 border-slate-700 hover:bg-slate-700"}
                      >
                        {source.enabled ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Reliability:</span>
                        <span className={`font-medium ${getSourceReliabilityColor(source.reliability)}`}>
                          {(source.reliability * 100).toFixed(0)}%
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Category:</span>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                          {source.category}
                        </Badge>
                      </div>
                      
                      {sourceStats[source.name]?.lastFetch && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Last Fetch:</span>
                          <span className="text-slate-300 text-xs">
                            {formatTimeAgo(sourceStats[source.name].lastFetch)}
                          </span>
                        </div>
                      )}
                      
                      {sourceStats[source.name]?.articlesFetched && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Articles:</span>
                          <span className="text-slate-300 text-xs">
                            {sourceStats[source.name].articlesFetched}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auto Refresh Controls */}
        {autoRefresh && (
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Zap className="w-5 h-5" />
                  <span>Auto-refreshing every {refreshInterval} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRefreshInterval(prev => Math.max(1, prev - 1))}
                    className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                  >
                    -
                  </Button>
                  <span className="text-white w-12 text-center">{refreshInterval}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRefreshInterval(prev => Math.min(60, prev + 1))}
                    className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                  >
                    +
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Market Sentiment Summary */}
        {sentimentSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Overall Sentiment</p>
                    <div className="flex items-center gap-2">
                      {sentimentSummary.overall_sentiment > 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                      <div className={`text-2xl font-bold ${getSentimentColor(sentimentSummary.overall_sentiment)}`}>
                        {(sentimentSummary.overall_sentiment * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <BarChart3 className="w-8 h-8 text-slate-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">News Articles</p>
                    <div className="text-2xl font-bold text-white">{sentimentSummary.news_count}</div>
                  </div>
                  <Newspaper className="w-8 h-8 text-slate-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">High Impact News</p>
                    <div className="text-2xl font-bold text-orange-400">{sentimentSummary.high_impact_count}</div>
                  </div>
                  <AlertCircle className="w-8 h-8 text-slate-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-2">Trending Tickers</p>
                  <div className="flex flex-wrap gap-1">
                    {sentimentSummary.trending_tickers.slice(0, 3).map(ticker => (
                      <Badge key={ticker} className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                        {ticker}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Source Distribution */}
        {sentimentSummary && Object.keys(sentimentSummary.source_breakdown).length > 0 && (
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                Source Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(sentimentSummary.source_breakdown).map(([source, count]) => {
                  const sourceInfo = newsSources.find(s => s.name === source);
                  return (
                    <div key={source} className="bg-slate-800/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300 font-medium">{source}</span>
                        <span className="text-white font-bold">{count}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-400"
                          style={{ 
                            width: `${(count / sentimentSummary.news_count) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm mb-8">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Filter className="w-5 h-5" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                    Active
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-center flex-1">
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
                  <option value="all">All Impact</option>
                  <option value="HIGH">High Impact</option>
                  <option value="MEDIUM">Medium Impact</option>
                  <option value="LOW">Low Impact</option>
                </select>
                
                <select 
                  value={filters.sentiment}
                  onChange={(e) => setFilters(prev => ({ ...prev, sentiment: e.target.value }))}
                  className="bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Sentiment</option>
                  <option value="positive">Positive News</option>
                  <option value="neutral">Neutral News</option>
                  <option value="negative">Negative News</option>
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
                
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
            <div className="mt-3 text-sm text-slate-400">
              Showing {filteredNews.length} of {news.length} articles
            </div>
          </CardContent>
        </Card>

        {/* News Feed */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-xl font-bold text-white">
            <Newspaper className="w-6 h-6 text-blue-400" />
            <h2>Market News Feed</h2>
          </div>
          
          {isLoading ? (
            <div className="grid gap-6">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="bg-slate-900/50 border-slate-700/50">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-slate-800 rounded w-1/4"></div>
                      <div className="h-6 bg-slate-800 rounded"></div>
                      <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <AnimatePresence>
              <div className="grid gap-6">
                {filteredNews.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-slate-800 text-slate-300 border-slate-600">
                              {article.source}
                            </Badge>
                            <Badge className={getSentimentBadgeColor(article.sentiment_score)}>
                              {article.sentiment_score > 0.3 ? 'Positive' : 
                               article.sentiment_score < -0.3 ? 'Negative' : 'Neutral'}
                            </Badge>
                            <Badge className={getImpactBadgeColor(article.impact_level)}>
                              {article.impact_level}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <Clock className="w-4 h-4" />
                            {article.created_date && formatTimeAgo(article.created_date)}
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-white mb-3 leading-tight">
                          {article.headline}
                        </h3>
                        
                        {article.summary && (
                          <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                            {article.summary}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-slate-400">
                              <span className="font-medium">Sector:</span> {article.sector}
                            </div>
                            {article.tickers_mentioned && article.tickers_mentioned.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-400 font-medium">Tickers:</span>
                                <div className="flex gap-1">
                                  {article.tickers_mentioned.slice(0, 4).map(ticker => (
                                    <Badge key={ticker} className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                                      {ticker}
                                    </Badge>
                                  ))}
                                  {article.tickers_mentioned.length > 4 && (
                                    <span className="text-xs text-slate-400">
                                      +{article.tickers_mentioned.length - 4} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          {article.url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(article.url, '_blank')}
                              className="text-slate-300 border-slate-600 hover:bg-slate-800"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Read Full Article
                            </Button>
                          )}
                        </div>
                        
                        {/* Sentiment Indicator */}
                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-400">
                              Market Psychology Impact
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 ${
                                    article.sentiment_score > 0 ? 'bg-green-400' : 
                                    article.sentiment_score < 0 ? 'bg-red-400' : 'bg-yellow-400'
                                  }`}
                                  style={{ 
                                    width: `${Math.abs(article.sentiment_score) * 100}%` 
                                  }}
                                />
                              </div>
                              <span className={`text-sm font-medium ${getSentimentColor(article.sentiment_score)}`}>
                                {(article.sentiment_score * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
          
          {/* No Results */}
          {!isLoading && filteredNews.length === 0 && (
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="p-12 text-center">
                <Newspaper className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No articles found</h3>
                <p className="text-slate-400 mb-6">
                  Try adjusting your filters or refresh the data to see more articles.
                </p>
                <Button 
                  onClick={handleRefresh}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sector Sentiment Overview */}
        {sentimentSummary && Object.keys(sentimentSummary.sector_sentiment).length > 0 && (
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm mt-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Sector Sentiment Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(sentimentSummary.sector_sentiment).map(([sector, sentiment]) => (
                  <div key={sector} className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 font-medium">{sector}</span>
                      <span className={`text-sm font-bold ${getSentimentColor(sentiment)}`}>
                        {(sentiment * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          sentiment > 0 ? 'bg-green-400' : 
                          sentiment < 0 ? 'bg-red-400' : 'bg-yellow-400'
                        }`}
                        style={{ 
                          width: `${Math.abs(sentiment) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Psychology Insights */}
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Market Psychology Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sentimentSummary?.overall_sentiment && (
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">Current Market Mood</h4>
                  <p className="text-slate-300 text-sm">
                    {sentimentSummary.overall_sentiment > 0.3 ? 
                      "Market sentiment is positive, which may boost trader confidence but watch for overconfidence. This is a good time to trust your trading plan while remaining disciplined." :
                    sentimentSummary.overall_sentiment < -0.3 ?
                      "Market sentiment is negative, which may increase stress and fear-based decisions. Consider reducing position sizes and focusing on risk management during this period." :
                      "Market sentiment is neutral, providing a balanced environment for decision-making. This can be ideal for executing your trading strategy without strong emotional pressure."
                    }
                  </p>
                </div>
              )}
              
              {sentimentSummary && sentimentSummary.high_impact_count > 3 && (
                <div className="bg-orange-900/20 border border-orange-500/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-400 mb-2">High Volatility Warning</h4>
                  <p className="text-slate-300 text-sm">
                    There are {sentimentSummary.high_impact_count} high-impact news stories today. 
                    High news volume often correlates with increased volatility and emotional trading decisions. 
                    Consider smaller position sizes and extra attention to your psychological state.
                  </p>
                </div>
              )}
              
              {sentimentSummary && Object.keys(sentimentSummary.source_breakdown).length > 5 && (
                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-400 mb-2">Diverse News Sources</h4>
                  <p className="text-slate-300 text-sm">
                    News is being gathered from {Object.keys(sentimentSummary.source_breakdown).length} different sources, 
                    providing a comprehensive view of market sentiment. This diversity helps reduce bias and provides more reliable insights.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}