"use client"

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPageUrl } from "@/utils";
import { 
  BarChart3, 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Activity,
  Zap,
  Menu
} from "lucide-react";
import {
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Mood Tracking",
    url: "/mood-tracking",
    icon: Activity,
  },
  {
    title: "AI Coach",
    url: "/ai-coach",
    icon: MessageSquare,
  },
  {
    title: "Market Intelligence",
    url: "/market-intelligence",
    icon: TrendingUp,
  },
  {
    title: "Psychology Patterns",
    url: "/psychology-patterns",
    icon: Brain,
  }
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-950">
        <Sidebar className="border-r border-slate-800 bg-slate-900">
          <SidebarHeader className="border-b border-slate-800 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white text-xl">OMI v3.0</h2>
                <p className="text-xs text-slate-400">AI Trading Psychology</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Navigation
            </div>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={`transition-all duration-200 rounded-lg mb-1 ${
                      pathname === item.url 
                        ? 'bg-slate-800 text-blue-400 border-l-2 border-blue-400' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-blue-400'
                    }`}
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-4 py-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto bg-slate-950">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}