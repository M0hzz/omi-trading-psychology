"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity } from "lucide-react";
import type { MoodEntry } from "@/entities";

interface MoodChartProps {
  moodEntries: MoodEntry[];
  isLoading: boolean;
}

export default function MoodChart({ moodEntries, isLoading }: MoodChartProps) {
  const getChartData = () => {
    return moodEntries
      .slice(0, 14)
      .reverse()
      .map(entry => ({
        date: new Date(entry.created_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mood: entry.mood_score,
        energy: entry.energy_level,
        stress: entry.stress_level,
        confidence: entry.trading_confidence,
        fullDate: new Date(entry.created_date!).toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 text-sm mb-2 font-medium">{payload[0]?.payload?.fullDate}</p>
          {payload.map((pld: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: pld.color }}
              />
              <span className="text-slate-300 text-sm capitalize">
                {pld.dataKey}: <span className="font-semibold">{pld.value}/10</span>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Mood Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-slate-800 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  const chartData = getChartData();

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Mood Trends (Last {chartData.length} Entries)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                fontSize={12}
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis 
                stroke="#94a3b8"
                fontSize={12}
                domain={[1, 10]}
                tick={{ fill: '#94a3b8' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
              />
              <Line 
                type="monotone" 
                dataKey="mood" 
                stroke="#22c55e" 
                strokeWidth={3}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#22c55e', strokeWidth: 2 }}
                name="Mood"
              />
              <Line 
                type="monotone" 
                dataKey="energy" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
                name="Energy"
              />
              <Line 
                type="monotone" 
                dataKey="stress" 
                stroke="#ef4444" 
                strokeWidth={3}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#ef4444', strokeWidth: 2 }}
                name="Stress"
              />
              <Line 
                type="monotone" 
                dataKey="confidence" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#8b5cf6', strokeWidth: 2 }}
                name="Confidence"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}