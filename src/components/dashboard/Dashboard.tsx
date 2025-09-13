// src/components/dashboard/Dashboard.tsx
"use client"

import React, { useState, useEffect } from "react";
import { MoodEntryService } from "@/entities/MoodEntry";
import type { MoodEntry } from "@/entities/MoodEntry";
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

import QuickActions from "@/components/dashboard/QuickActions";

export default function Dashboard() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const moods = await MoodEntryService.list("-created_date", 10);
      setMoodEntries(moods);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  };

  const getRecentMoodTrend = () => {
    if (moodEntries.length < 2) return "STABLE";
    const recent = moodEntries.slice(0, 3);
    const older = moodEntries.slice(3, 6);
    
    if (recent.length === 0 || older.length === 0) return "STABLE";
    
    const recentAvg = recent.reduce((sum, entry) => sum + entry.mood_score, 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry.mood_score, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.5) return "IMPROVING";
    if (recentAvg < olderAvg - 0.5) return "DECLINING";
    return "STABLE";
  };

  const getAverageScores = () => {
    if (moodEntries.length === 0) return { mood: 0, energy: 0, stress: 0, confidence: 0 };
    
    const recent = moodEntries.slice(0, 7); // Last 7 entries
    return {
      mood: Math.round((recent.reduce((sum, entry) => sum + entry.mood_score, 0) / recent.length) * 10) / 10,
      energy: Math.round((recent.reduce((sum, entry) => sum + entry.energy_level, 0) / recent.length) * 10) / 10,
      stress: Math.round((recent.reduce((sum, entry) => sum + entry.stress_level, 0) / recent.length) * 10) / 10,
      confidence: Math.round((recent.reduce((sum, entry) => sum + entry.trading_confidence, 0) / recent.length) * 10) / 10
    };
  };

  const getScoreColor = (score: number, isStress: boolean = false) => {
    if (isStress) {
      // For stress, lower is better
      if (score <= 3) return "text-green-400";
      if (score <= 6) return "text-yellow-400";
      return "text-red-400";
    } else {
      // For others, higher is better
      if (score >= 8) return "text-green-400";
      if (score >= 5) return "text-yellow-400";
      return "text-red-400";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "IMPROVING":
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "DECLINING":
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <BarChart3 className="w-4 h-4 text-yellow-400" />;
    }
  };

  const averages = getAverageScores();
  const trend = getRecentMoodTrend();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
          <Brain className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Mental Health Dashboard</h1>
          <p className="text-slate-400">Your psychological wellness overview</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Mood</p>
                <p className={`text-2xl font-bold ${getScoreColor(averages.mood)}`}>
                  {averages.mood}/10
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Energy</p>
                <p className={`text-2xl font-bold ${getScoreColor(averages.energy)}`}>
                  {averages.energy}/10
                </p>
              </div>
              <Zap className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Stress</p>
                <p className={`text-2xl font-bold ${getScoreColor(averages.stress, true)}`}>
                  {averages.stress}/10
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Confidence</p>
                <p className={`text-2xl font-bold ${getScoreColor(averages.confidence)}`}>
                  {averages.confidence}/10
                </p>
              </div>
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {getTrendIcon(trend)}
            Recent Trend Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <h4 className="font-semibold text-blue-400 mb-2">Psychological State</h4>
              <p className="text-slate-300 text-sm">
                Your recent mood trend is{" "}
                <span className={`font-semibold ${
                  trend === 'IMPROVING' ? 'text-green-400' : 
                  trend === 'DECLINING' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {trend.toLowerCase()}
                </span>. 
                {trend === 'IMPROVING' && " Keep up the positive momentum with your current routine."}
                {trend === 'DECLINING' && " Consider implementing stress reduction techniques."}
                {trend === 'STABLE' && " Maintaining consistent psychological state is excellent for trading."}
              </p>
            </div>
            
            {moodEntries.length > 0 && (
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h4 className="font-semibold text-green-400 mb-2">Latest Entry</h4>
                <p className="text-slate-300 text-sm">
                  Last logged on {new Date(moodEntries[0].created_date!).toLocaleDateString()}
                  {" with mood score of "}
                  <span className={`font-semibold ${getScoreColor(moodEntries[0].mood_score)}`}>
                    {moodEntries[0].mood_score}/10
                  </span>
                  {moodEntries[0].notes && `: "${moodEntries[0].notes}"`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Entries */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Recent Mood Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center text-slate-400 py-8">
                  <Activity className="w-16 h-16 mx-auto mb-4 opacity-50 animate-pulse" />
                  <p>Loading your mental health data...</p>
                </div>
              ) : moodEntries.length === 0 ? (
                <div className="text-center text-slate-400 py-10">
                  <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-white mb-2">No mood entries yet</h3>
                  <p>Start tracking your mental health to see patterns and insights.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {moodEntries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300 text-sm">
                          {new Date(entry.created_date!).toLocaleDateString()}
                        </span>
                        <Badge className={
                          entry.market_sentiment === "BULLISH" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                          entry.market_sentiment === "BEARISH" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                          entry.market_sentiment === "UNCERTAIN" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                          "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }>
                          {entry.market_sentiment}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-slate-400">Mood:</span>{" "}
                          <span className={getScoreColor(entry.mood_score)}>{entry.mood_score}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Energy:</span>{" "}
                          <span className={getScoreColor(entry.energy_level)}>{entry.energy_level}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Stress:</span>{" "}
                          <span className={getScoreColor(entry.stress_level, true)}>{entry.stress_level}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Confidence:</span>{" "}
                          <span className={getScoreColor(entry.trading_confidence)}>{entry.trading_confidence}</span>
                        </div>
                      </div>
                      {entry.notes && (
                        <p className="text-slate-300 text-xs mt-2 italic">"{entry.notes}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          <QuickActions />
          
          {/* Psychology Tips */}
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                Psychology Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                  <h4 className="font-semibold text-blue-300 mb-1">Daily Check-ins</h4>
                  <p className="text-blue-200">Regular mood tracking helps identify patterns and triggers.</p>
                </div>
                <div className="p-3 bg-green-900/20 rounded-lg border border-green-500/30">
                  <h4 className="font-semibold text-green-300 mb-1">Stress Management</h4>
                  <p className="text-green-200">High stress levels can negatively impact trading decisions.</p>
                </div>
                <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                  <h4 className="font-semibold text-purple-300 mb-1">Consistency</h4>
                  <p className="text-purple-200">Stable psychological state leads to better trading performance.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}