"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { PsychologyPattern } from "@/entities";

interface PatternAnalyticsProps {
  patterns: PsychologyPattern[];
  isLoading: boolean;
}

export default function PatternAnalytics({ patterns, isLoading }: PatternAnalyticsProps) {
  const getPatternTypeData = () => {
    const typeCount: Record<string, number> = {};
    const typeConfidence: Record<string, number[]> = {};

    patterns.forEach(pattern => {
      const type = pattern.pattern_type.replace(/_/g, ' ');
      typeCount[type] = (typeCount[type] || 0) + 1;
      if (!typeConfidence[type]) typeConfidence[type] = [];
      typeConfidence[type].push(pattern.confidence);
    });

    return Object.entries(typeCount).map(([type, count]) => ({
      type: type.length > 12 ? type.slice(0, 12) + '...' : type,
      fullType: type,
      count,
      avgConfidence: typeConfidence[type].reduce((a, b) => a + b, 0) / typeConfidence[type].length,
      confidencePercent: Math.round((typeConfidence[type].reduce((a, b) => a + b, 0) / typeConfidence[type].length) * 100)
    }));
  };

  const getSeverityData = () => {
    const severityCount = patterns.reduce((acc, pattern) => {
      acc[pattern.severity] = (acc[pattern.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { severity: 'HIGH', count: severityCount.HIGH || 0, color: '#ef4444' },
      { severity: 'MEDIUM', count: severityCount.MEDIUM || 0, color: '#eab308' },
      { severity: 'LOW', count: severityCount.LOW || 0, color: '#22c55e' }
    ];
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "IMPROVING": return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "DECLINING": return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-yellow-400" />;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 text-sm font-medium mb-1">{payload[0]?.payload?.fullType}</p>
          <p className="text-slate-300 text-sm">
            Count: <span className="font-semibold text-blue-400">{payload[0]?.value}</span>
          </p>
          <p className="text-slate-300 text-sm">
            Avg Confidence: <span className="font-semibold text-green-400">
              {payload[0]?.payload?.confidencePercent}%
            </span>
          </p>
        </div>
      );
    }
    return null;
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

  const patternTypeData = getPatternTypeData();
  const severityData = getSeverityData();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Pattern Types & Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={patternTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="type" 
                    stroke="#94a3b8"
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    fontSize={12}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-orange-400" />
              Severity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {severityData.map((item) => (
                <div key={item.severity} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-300 font-medium">{item.severity} Severity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className="text-slate-400 border-slate-600"
                    >
                      {item.count} patterns
                    </Badge>
                    <div className="w-20 bg-slate-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(item.count / patterns.length) * 100}%`,
                          backgroundColor: item.color 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pattern Insights Summary */}
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-400" />
            Pattern Insights Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {patterns.slice(0, 3).map((pattern, index) => (
              <div key={pattern.id} className="p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-blue-400">
                    {pattern.pattern_type.replace(/_/g, ' ')}
                  </h4>
                  {getTrendIcon(pattern.trend)}
                </div>
                <p className="text-slate-300 text-xs mb-3 leading-relaxed">
                  {pattern.description.slice(0, 120)}...
                </p>
                <div className="flex gap-2">
                  <Badge 
                    className={
                      pattern.severity === 'HIGH' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      pattern.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-green-500/20 text-green-400 border-green-500/30'
                    }
                  >
                    {pattern.severity}
                  </Badge>
                  <Badge variant="outline" className="text-slate-400 border-slate-600 text-xs">
                    {Math.round(pattern.confidence * 100)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}