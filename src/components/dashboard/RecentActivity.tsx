"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Brain, TrendingUp, MessageSquare } from "lucide-react";
import type { MoodEntry, MarketIntelligence, PsychologyPattern } from "@/entities";

interface RecentActivityProps {
  moodEntries: MoodEntry[];
  marketNews: MarketIntelligence[];
  patterns: PsychologyPattern[];
  isLoading: boolean;
}

export default function RecentActivity({ moodEntries, marketNews, patterns, isLoading }: RecentActivityProps) {
  const getRecentActivities = () => {
    const activities: Array<{
      id: string;
      type: 'mood' | 'news' | 'pattern';
      title: string;
      subtitle: string;
      time: string;
      icon: any;
      color: string;
    }> = [];

    // Add recent mood entries
    moodEntries.slice(0, 3).forEach(entry => {
      activities.push({
        id: `mood-${entry.id}`,
        type: 'mood',
        title: `Mood Entry: ${entry.mood_score}/10`,
        subtitle: `Energy: ${entry.energy_level}, Stress: ${entry.stress_level}`,
        time: new Date(entry.created_date!).toLocaleString(),
        icon: Activity,
        color: 'text-green-400'
      });
    });

    // Add recent news
    marketNews.slice(0, 2).forEach(news => {
      activities.push({
        id: `news-${news.id}`,
        type: 'news',
        title: news.headline.slice(0, 50) + '...',
        subtitle: `${news.source} • ${news.sector}`,
        time: new Date(news.created_date!).toLocaleString(),
        icon: TrendingUp,
        color: news.sentiment_score > 0 ? 'text-green-400' : 'text-red-400'
      });
    });

    // Add recent patterns
    patterns.slice(0, 2).forEach(pattern => {
      activities.push({
        id: `pattern-${pattern.id}`,
        type: 'pattern',
        title: pattern.pattern_type.replace(/_/g, ' '),
        subtitle: `${pattern.severity} severity • ${Math.round(pattern.confidence * 100)}% confidence`,
        time: new Date(pattern.created_date!).toLocaleString(),
        icon: Brain,
        color: pattern.severity === 'HIGH' ? 'text-red-400' : pattern.severity === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
      });
    });

    // Sort by time (most recent first)
    return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-full"></div>
                <div className="h-3 bg-slate-800 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activities = getRecentActivities();

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Start logging mood entries to see activity here</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                <div className={`p-2 rounded-lg bg-slate-800 ${activity.color}`}>
                  <activity.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate">
                    {activity.title}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">
                    {activity.subtitle}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(activity.time).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                  {activity.type}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}