"use client"

import React, { useState, useEffect } from 'react';
import { MarketIntelligenceService, type MarketSentimentSummary } from '@/entities/MarketIntelligence';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from "lucide-react";

interface MarketSentimentProps {
  isLoading?: boolean;
}

export default function MarketSentiment({ isLoading = false }: MarketSentimentProps) {
  const [sentimentData, setSentimentData] = useState<MarketSentimentSummary | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    loadSentimentData();
  }, []);

  const loadSentimentData = async () => {
    try {
      const summary = await MarketIntelligenceService.getSentimentSummary();
      setSentimentData(summary);
    } catch (error) {
      console.error('Error loading market sentiment:', error);
    }
    setDataLoading(false);
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return "text-green-400";
    if (score < -0.3) return "text-red-400";
    return "text-yellow-400";
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.3) return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (score < -0.3) return <TrendingDown className="w-5 h-5 text-red-400" />;
    return <BarChart3 className="w-5 h-5 text-yellow-400" />;
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.5) return "Very Bullish";
    if (score > 0.2) return "Bullish";
    if (score > -0.2) return "Neutral";
    if (score > -0.5) return "Bearish";
    return "Very Bearish";
  };

  const getTopSectors = () => {
    if (!sentimentData?.sector_sentiment) return [];
    
    return Object.entries(sentimentData.sector_sentiment)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
  };

  if (isLoading || dataLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Market Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-800 rounded"></div>
              <div className="h-4 bg-slate-800 rounded w-3/4"></div>
              <div className="h-4 bg-slate-800 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sentimentData) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Market Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">Unable to load market sentiment data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Market Sentiment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Sentiment */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {getSentimentIcon(sentimentData.overall_sentiment)}
            <div className={`text-2xl font-bold ${getSentimentColor(sentimentData.overall_sentiment)}`}>
              {(sentimentData.overall_sentiment * 100).toFixed(1)}%
            </div>
          </div>
          <div className="text-sm text-slate-400 mb-3">
            {getSentimentLabel(sentimentData.overall_sentiment)}
          </div>
          
          {/* Sentiment Bar */}
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-4">
            <div 
              className={`h-full transition-all duration-500 ${
                sentimentData.overall_sentiment > 0 ? 'bg-green-400' : 
                sentimentData.overall_sentiment < 0 ? 'bg-red-400' : 'bg-yellow-400'
              }`}
              style={{ 
                width: `${Math.abs(sentimentData.overall_sentiment) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-white">{sentimentData.news_count}</div>
            <div className="text-xs text-slate-400">Articles</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-400">{sentimentData.high_impact_count}</div>
            <div className="text-xs text-slate-400">High Impact</div>
          </div>
        </div>

        {/* Top Trending Tickers */}
        {sentimentData.trending_tickers.length > 0 && (
          <div>
            <div className="text-sm font-medium text-slate-300 mb-2">Trending Tickers</div>
            <div className="flex flex-wrap gap-1">
              {sentimentData.trending_tickers.slice(0, 5).map(ticker => (
                <Badge key={ticker} className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                  {ticker}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Top Sectors */}
        {getTopSectors().length > 0 && (
          <div>
            <div className="text-sm font-medium text-slate-300 mb-2">Sector Leaders</div>
            <div className="space-y-2">
              {getTopSectors().map(([sector, sentiment]) => (
                <div key={sector} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{sector}</span>
                  <span className={`text-xs font-medium ${getSentimentColor(sentiment)}`}>
                    {(sentiment * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Psychology Insight */}
        <div className="bg-slate-800/50 p-3 rounded-lg">
          <div className="text-xs font-medium text-blue-400 mb-1">Psychology Impact</div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {sentimentData.overall_sentiment > 0.3 ? 
              "Positive sentiment may boost confidence but watch for overconfidence." :
            sentimentData.overall_sentiment < -0.3 ?
              "Negative sentiment may increase stress. Consider smaller positions." :
              "Neutral sentiment provides balanced environment for trading."
            }
          </p>
        </div>

        {/* High Impact Warning */}
        {sentimentData.high_impact_count > 2 && (
          <div className="bg-orange-900/20 border border-orange-500/30 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-orange-400 text-xs font-medium mb-1">
              <AlertTriangle className="w-3 h-3" />
              Volatility Alert
            </div>
            <p className="text-xs text-slate-300">
              {sentimentData.high_impact_count} high-impact stories may increase market volatility.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}