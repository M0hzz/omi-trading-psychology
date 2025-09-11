"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp } from "lucide-react";
import type { MarketIntelligence } from "@/entities";

interface SentimentChartProps {
  marketNews: MarketIntelligence[];
  isLoading: boolean;
}

export default function SentimentChart({ marketNews, isLoading }: SentimentChartProps) {
  const getSentimentBySector = () => {
    const sectorData: Record<string, { total: number; count: number; sentiment: number }> = {};
    
    marketNews.forEach(news => {
      if (!sectorData[news.sector]) {
        sectorData[news.sector] = { total: 0, count: 0, sentiment: 0 };
      }
      sectorData[news.sector].total += news.sentiment_score;
      sectorData[news.sector].count += 1;
    });

    return Object.entries(sectorData).map(([sector, data]) => ({
      sector: sector.length > 10 ? sector.slice(0, 10) + '...' : sector,
      fullSector: sector,
      avgSentiment: data.total / data.count,
      articles: data.count
    })).sort((a, b) => b.avgSentiment - a.avgSentiment);
  };

  const getSentimentDistribution = () => {
    const positive = marketNews.filter(n => n.sentiment_score > 0.3).length;
    const negative = marketNews.filter(n => n.sentiment_score < -0.3).length;
    const neutral = marketNews.length - positive - negative;

    return [
      { name: 'Positive', value: positive, color: '#22c55e' },
      { name: 'Neutral', value: neutral, color: '#eab308' },
      { name: 'Negative', value: negative, color: '#ef4444' }
    ];
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 text-sm font-medium mb-1">{payload[0]?.payload?.fullSector}</p>
          <p className="text-slate-300 text-sm">
            Avg Sentiment: <span className={`font-semibold ${payload[0]?.value > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(payload[0]?.value * 100).toFixed(1)}%
            </span>
          </p>
          <p className="text-slate-400 text-xs">
            {payload[0]?.payload?.articles} articles
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label function to fix TypeScript error
  const renderPieLabel = (entry: any) => {
    return `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <div className="h-6 bg-slate-800 rounded w-48 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-slate-800 rounded animate-pulse"></div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <div className="h-6 bg-slate-800 rounded w-48 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-slate-800 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sectorData = getSentimentBySector();
  const distributionData = getSentimentDistribution();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Sentiment by Sector
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  type="number" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  domain={[-1, 1]}
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="sector" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  width={80}
                  tick={{ fill: '#94a3b8' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgSentiment" radius={[0, 4, 4, 0]}>
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avgSentiment > 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Sentiment Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={5}
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}