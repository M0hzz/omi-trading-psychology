"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity, Brain, BarChart3 } from "lucide-react";
import type { MoodEntry, MarketIntelligence, PsychologyPattern } from "@/entities";

interface DashboardStatsProps {
  moodEntries: MoodEntry[];
  marketNews: MarketIntelligence[];
  patterns: PsychologyPattern[];
  isLoading: boolean;
}

export default function DashboardStats({ moodEntries, marketNews, patterns, isLoading }: DashboardStatsProps) {
  const getAverageMood = () => {
    if (moodEntries.length === 0) return 0;
    return (moodEntries.reduce((sum, entry) => sum + entry.mood_score, 0) / moodEntries.length).toFixed(1);
  };

  const getAverageStress = () => {
    if (moodEntries.length === 0) return 0;
    return (moodEntries.reduce((sum, entry) => sum + entry.stress_level, 0) / moodEntries.length).toFixed(1);
  };

  const getHighSeverityPatterns = () => {
    return patterns.filter(p => p.severity === "HIGH").length;
  };

  const getPositiveNewsPercentage = () => {
    if (marketNews.length === 0) return 0;
    const positiveNews = marketNews.filter(news => news.sentiment_score > 0.3).length;
    return Math.round((positiveNews / marketNews.length) * 100);
  };

  const statsData = [
    {
      title: "Average Mood",
      value: isLoading ? "..." : getAverageMood(),
      subtitle: `Past ${moodEntries.length} entries`,
      icon: Activity,
      color: "text-green-400",
      bgColor: "bg-green-500/20 border-green-500/30"
    },
    {
      title: "Stress Level",
      value: isLoading ? "..." : getAverageStress(),
      subtitle: "Current average",
      icon: BarChart3,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20 border-orange-500/30"
    },
    {
      title: "Active Patterns",
      value: isLoading ? "..." : getHighSeverityPatterns(),
      subtitle: "High severity",
      icon: Brain,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20 border-purple-500/30"
    },
    {
      title: "Market Sentiment",
      value: isLoading ? "..." : `${getPositiveNewsPercentage()}%`,
      subtitle: "Positive news",
      icon: TrendingUp,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20 border-blue-500/30"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <Card key={index} className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 w-16 bg-slate-800 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-slate-800 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-white">
                  {stat.value}
                </div>
                <p className="text-xs text-slate-500">
                  {stat.subtitle}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}