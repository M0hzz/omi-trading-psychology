"use client"

import React, { useState, useEffect } from "react";
import { MoodEntryService, MarketIntelligenceService, PsychologyPatternService } from "@/entities";
import type { MoodEntry, MarketIntelligence, PsychologyPattern } from "@/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Brain, 
  AlertTriangle,
  Zap,
  BarChart3
} from "lucide-react";

import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";
import MoodChart from "@/components/dashboard/MoodChart";
import SentimentChart from "@/components/dashboard/SentimentChart";
import PatternAnalytics from "@/components/dashboard/PatternAnalytics";

export default function DashboardPage() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [marketNews, setMarketNews] = useState<MarketIntelligence[]>([]);
  const [patterns, setPatterns] = useState<PsychologyPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [moods, news, psychPatterns] = await Promise.all([
        MoodEntryService.list("-created_date", 50),
        MarketIntelligenceService.list("-created_date", 20),
        PsychologyPatternService.list("-created_date", 10)
      ]);
      
      setMoodEntries(moods);
      setMarketNews(news);
      setPatterns(psychPatterns);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  };

  const getMarketMood = () => {
    if (marketNews.length === 0) return "NEUTRAL";
    const avgSentiment = marketNews.reduce((sum, news) => sum + news.sentiment_score, 0) / marketNews.length;
    if (avgSentiment > 0.3) return "BULLISH";
    if (avgSentiment < -0.3) return "BEARISH";
    return "MIXED";
  };

  const getActiveAlerts = () => {
    return patterns.filter(p => p.severity === "HIGH" && p.trend === "DECLINING");
  };

  const getRecentMoodTrend = () => {
    if (moodEntries.length < 2) return "STABLE";
    const recent = moodEntries.slice(0, 3);
    const older = moodEntries.slice(3, 6);
    
    const recentAvg = recent.reduce((sum, entry) => sum + entry.mood_score, 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry.mood_score, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.5) return "IMPROVING";
    if (recentAvg < olderAvg - 0.5) return "DECLINING";
    return "STABLE";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                Trading Psychology Dashboard
              </h1>
              <p className="text-slate-400">
                Your personal JARVIS for mental performance & market intelligence
              </p>
            </div>
          </div>
          
          {getActiveAlerts().length > 0 && (
            <Card className="bg-red-900/20 border-red-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">
                    {getActiveAlerts().length} Psychology Alert{getActiveAlerts().length > 1 ? 's' : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats Overview */}
        <DashboardStats 
          moodEntries={moodEntries}
          marketNews={marketNews}
          patterns={patterns}
          isLoading={isLoading}
        />

        {/* Charts Section */}
        <div className="mt-8 space-y-8">
          {/* Mood Trends Chart */}
          <MoodChart moodEntries={moodEntries} isLoading={isLoading} />

          {/* Market Sentiment Charts */}
          <SentimentChart marketNews={marketNews} isLoading={isLoading} />

          {/* Pattern Analytics */}
          <PatternAnalytics patterns={patterns} isLoading={isLoading} />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {/* Left Column - Activity & Insights */}
          <div className="lg:col-span-2">
            <RecentActivity 
              moodEntries={moodEntries}
              marketNews={marketNews}
              patterns={patterns}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column - Quick Actions & Market Mood */}
          <div className="space-y-6">
            <QuickActions />
            
            {/* Market Mood Widget */}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  Current Market Mood
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Badge 
                    className={`text-lg px-4 py-2 ${
                      getMarketMood() === "BULLISH" 
                        ? "bg-green-500/20 text-green-400 border-green-500/30" 
                        : getMarketMood() === "BEARISH"
                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                        : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    }`}
                  >
                    {getMarketMood() === "BULLISH" && <TrendingUp className="w-4 h-4 mr-1" />}
                    {getMarketMood() === "BEARISH" && <TrendingDown className="w-4 h-4 mr-1" />}
                    {getMarketMood() === "MIXED" && <Activity className="w-4 h-4 mr-1" />}
                    {getMarketMood()}
                  </Badge>
                  <p className="text-slate-400 text-sm mt-2">
                    Based on {marketNews.length} recent news articles
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Mood Entries</span>
                    <Badge variant="outline" className="text-slate-300 border-slate-600">
                      {moodEntries.length} logged
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Patterns Detected</span>
                    <Badge variant="outline" className="text-slate-300 border-slate-600">
                      {patterns.length} active
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">High Priority Alerts</span>
                    <Badge className={getActiveAlerts().length > 0 ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}>
                      {getActiveAlerts().length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Mood Trend</span>
                    <Badge className={
                      getRecentMoodTrend() === 'IMPROVING' ? "bg-green-500/20 text-green-400 border-green-500/30" :
                      getRecentMoodTrend() === 'DECLINING' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                      "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    }>
                      {getRecentMoodTrend()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <h4 className="font-semibold text-blue-400 mb-1 text-sm">Mood Analysis</h4>
                    <p className="text-slate-300 text-xs">
                      Your mood is currently <span className={`font-semibold ${
                        getRecentMoodTrend() === 'IMPROVING' ? 'text-green-400' : 
                        getRecentMoodTrend() === 'DECLINING' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {getRecentMoodTrend().toLowerCase()}
                      </span>. 
                      {getRecentMoodTrend() === 'IMPROVING' && " Great momentum!"}
                      {getRecentMoodTrend() === 'DECLINING' && " Consider stress reduction."}
                      {getRecentMoodTrend() === 'STABLE' && " Consistency is key."}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <h4 className="font-semibold text-green-400 mb-1 text-sm">Market Opportunity</h4>
                    <p className="text-slate-300 text-xs">
                      Market sentiment: <span className="font-semibold text-blue-400">{getMarketMood()}</span>. 
                      {getMarketMood() === 'BULLISH' && " Positive alignment detected."}
                      {getMarketMood() === 'BEARISH' && " Stay disciplined."}
                      {getMarketMood() === 'MIXED' && " Use caution."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}