// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const user = await getCurrentUser()
  return !!user
}

// src/types/supabase.ts
export interface Database {
  public: {
    Tables: {
      mood_entries: {
        Row: {
          id: string
          user_id: string
          mood_score: number
          energy_level: number
          stress_level: number
          market_sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNCERTAIN'
          trading_confidence: number
          notes: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mood_score: number
          energy_level: number
          stress_level: number
          market_sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNCERTAIN'
          trading_confidence: number
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mood_score?: number
          energy_level?: number
          stress_level?: number
          market_sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNCERTAIN'
          trading_confidence?: number
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          frequency: 'daily' | 'multiple' | 'weekly'
          times: string[]
          days: number[] | null
          enabled: boolean
          last_triggered: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          frequency: 'daily' | 'multiple' | 'weekly'
          times: string[]
          days?: number[] | null
          enabled?: boolean
          last_triggered?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          frequency?: 'daily' | 'multiple' | 'weekly'
          times?: string[]
          days?: number[] | null
          enabled?: boolean
          last_triggered?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          timezone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      market_sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNCERTAIN'
      reminder_frequency: 'daily' | 'multiple' | 'weekly'
    }
  }
}