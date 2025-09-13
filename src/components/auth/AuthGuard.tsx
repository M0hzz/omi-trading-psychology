// src/components/auth/AuthGuard.tsx
"use client"

import React from 'react'
import { useAuth } from './AuthProvider'
import LoginForm from './LoginForm'
import { Card, CardContent } from "@/components/ui/card"
import { Brain } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-white animate-pulse" />
            </div>
            <p className="text-slate-300">Loading your mental health data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return fallback || <LoginForm />
  }

  return <>{children}</>
}