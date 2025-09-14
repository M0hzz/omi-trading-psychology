// src/components/NewsManagement.tsx
"use client"
import React, { useState } from 'react';
import { MarketIntelligenceService } from '@/entities/MarketIntelligence';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2, Clock, Database } from "lucide-react";

export default function NewsManagement() {
  const [newsCount, setNewsCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadNewsCount = async () => {
    const news = await MarketIntelligenceService.list();
    setNewsCount(news.length);
  };

  const handleRefreshNews = async () => {
    setIsRefreshing(true);
    try {
      await MarketIntelligenceService.updateNews();
      await loadNewsCount();
    } catch (error) {
      console.error('Error refreshing news:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteOldNews = async (days: number) => {
    setIsDeleting(true);
    try {
      const deletedCount = await MarketIntelligenceService.deleteOldNews(days);
      await loadNewsCount();
      alert(`Deleted ${deletedCount} news items older than ${days} days`);
    } catch (error) {
      console.error('Error deleting old news:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear all cached news data?')) {
      await MarketIntelligenceService.clearCache();
      await loadNewsCount();
      alert('Cache cleared successfully');
    }
  };

  React.useEffect(() => {
    loadNewsCount();
  }, []);

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          News Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{newsCount}</div>
            <div className="text-xs text-slate-400">Total Articles</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-400">30 min</div>
            <div className="text-xs text-slate-400">Cache Duration</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleRefreshNews}
            disabled={isRefreshing}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh News
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleDeleteOldNews(1)}
              disabled={isDeleting}
              variant="outline"
              className="bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear 1 Day
            </Button>
            <Button
              onClick={() => handleDeleteOldNews(7)}
              disabled={isDeleting}
              variant="outline"
              className="bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              <Clock className="w-4 h-4 mr-1" />
              Clear 7 Days
            </Button>
          </div>

          <Button
            onClick={handleClearCache}
            variant="outline"
            className="w-full bg-red-900/20 border-red-500/30 hover:bg-red-900/30 text-red-400"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Cache
          </Button>
        </div>

        {/* Info Section */}
        <div className="text-xs text-slate-400 space-y-1">
          <p>• News is cached for 30 minutes</p>
          <p>• Maximum 100 articles stored</p>
          <p>• Duplicates are automatically removed</p>
          <p>• Old news is cleaned up when adding new articles</p>
        </div>
      </CardContent>
    </Card>
  );
}