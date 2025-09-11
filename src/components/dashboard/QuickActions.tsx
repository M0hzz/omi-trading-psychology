"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Brain, TrendingUp, MessageSquare, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: "Log Mood Entry",
      description: "Track your current psychological state",
      icon: Activity,
      color: "bg-green-600 hover:bg-green-700",
      action: () => router.push('/mood-tracking')
    },
    {
      title: "View Patterns",
      description: "Analyze your behavioral patterns",
      icon: Brain,
      color: "bg-purple-600 hover:bg-purple-700",
      action: () => router.push('/psychology-patterns')
    },
    {
      title: "Market Intelligence",
      description: "Check latest market sentiment",
      icon: TrendingUp,
      color: "bg-blue-600 hover:bg-blue-700",
      action: () => router.push('/market-intelligence')
    },
    {
      title: "AI Coach",
      description: "Get personalized psychology advice",
      icon: MessageSquare,
      color: "bg-indigo-600 hover:bg-indigo-700",
      action: () => router.push('/ai-coach')
    }
  ];

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-blue-400" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              className={`${action.color} text-white flex items-center gap-3 p-4 h-auto justify-start`}
            >
              <action.icon className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs opacity-90">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}