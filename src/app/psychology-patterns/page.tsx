"use client"

import React, { useState, useEffect } from "react";
import { PsychologyPatternService, type PsychologyPattern } from "@/entities/PsychologyPattern";
import { BrainCircuit, TrendingUp, TrendingDown, Minus, CheckCircle, Filter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PsychologyPatternsPage() {
  const [patterns, setPatterns] = useState<PsychologyPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "all",
    severity: "all"
  });

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    setIsLoading(true);
    try {
      const patternItems = await PsychologyPatternService.list("-confidence");
      setPatterns(patternItems);
    } catch (error) {
      console.error("Error loading psychology patterns:", error);
    }
    setIsLoading(false);
  };

  const filteredPatterns = patterns.filter(item => {
    return (
      (filters.type === "all" || item.pattern_type === filters.type) &&
      (filters.severity === "all" || item.severity === filters.severity)
    );
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "HIGH": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "MEDIUM": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-green-500/20 text-green-400 border-green-500/30";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "IMPROVING": return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "DECLINING": return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-yellow-400" />;
    }
  };
  
  const getPatternTypeColor = (type: string) => {
    switch (type) {
      case "CIRCADIAN": return "text-blue-400";
      case "WEEKLY": return "text-purple-400";
      case "MARKET_CORRELATION": return "text-orange-400";
      case "STRESS_PATTERN": return "text-red-400";
      case "CONFIDENCE_CYCLE": return "text-green-400";
      default: return "text-gray-400";
    }
  };

  const uniqueTypes = [...new Set(patterns.map(p => p.pattern_type))];
  const severityOptions = ["all", "HIGH", "MEDIUM", "LOW"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <BrainCircuit className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Psychology Patterns</h1>
            <p className="text-slate-400">Advanced behavioral pattern analysis and personalized insights</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm mb-8">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Filter className="w-5 h-5" />
                <span>Filters</span>
              </div>
              
              <div>
                <select 
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select 
                  value={filters.severity}
                  onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2 text-sm"
                >
                  {severityOptions.map(option => (
                    <option key={option} value={option}>
                      {option === "all" ? "All Severities" : `${option} Severity`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-sm text-slate-400">
                Showing {filteredPatterns.length} of {patterns.length} patterns
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patterns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="animate-pulse">
                  <div className="h-6 bg-slate-800 rounded w-3/4"></div>
                </CardHeader>
                <CardContent className="space-y-4 animate-pulse">
                  <div className="h-4 bg-slate-800 rounded w-full"></div>
                  <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-slate-800 rounded w-20"></div>
                    <div className="h-6 bg-slate-800 rounded w-24"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredPatterns.length > 0 ? (
            filteredPatterns.map(pattern => (
              <Card key={pattern.id} className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm h-full flex flex-col hover:border-blue-500/50 transition-all">
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle className={`text-lg font-bold ${getPatternTypeColor(pattern.pattern_type)}`}>
                    {pattern.pattern_type.replace(/_/g, ' ')}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(pattern.trend)}
                    <span className="text-xs text-slate-400">{pattern.trend}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-slate-300 text-sm mb-4 leading-relaxed">{pattern.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={getSeverityColor(pattern.severity)}>{pattern.severity} Severity</Badge>
                    <Badge variant="outline" className="text-slate-400 border-slate-600">
                      {Math.round(pattern.confidence * 100)}% Confidence
                    </Badge>
                    <Badge variant="outline" className="text-slate-400 border-slate-600">
                      {pattern.data_points} Data Points
                    </Badge>
                  </div>
                  
                  {pattern.trigger_conditions && pattern.trigger_conditions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-slate-400 mb-1">TRIGGERS:</h4>
                      <div className="flex flex-wrap gap-1">
                        {pattern.trigger_conditions.map(trigger => 
                          <Badge key={trigger} variant="secondary" className="text-xs">{trigger}</Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {pattern.recommendation && (
                    <div className="mt-auto p-3 bg-slate-800/70 rounded-lg">
                      <h4 className="font-semibold text-blue-400 text-sm mb-1 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4"/>
                        Actionable Recommendation
                      </h4>
                      <p className="text-slate-300 text-xs leading-relaxed">{pattern.recommendation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-10 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <BrainCircuit className="w-12 h-12 mx-auto text-slate-500 mb-4"/>
              <h3 className="text-lg font-semibold text-white">No Patterns Found</h3>
              <p className="text-slate-400">Try adjusting your filters or log more mood entries to discover patterns.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}