// src/lib/ai-coach-service.ts
import { GroqService } from '@/lib/groq-service'; // CHANGED: Import Groq instead of DeepSeek
import { SupabaseChatService } from './supabase-chat-service';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  created_date: string;
  mode: 'general' | 'trading';
}

export class AICoachService {
  static async getOrCreateSession(): Promise<ChatSession> {
    return SupabaseChatService.getOrCreateSession();
  }

  static async addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>, mode: 'general' | 'trading' = 'general'): Promise<ChatMessage> {
    return SupabaseChatService.addMessage(message, mode);
  }

  static async updateMode(mode: 'general' | 'trading'): Promise<void> {
    return SupabaseChatService.updateMode(mode);
  }

  // MAIN CHANGE: Replace DeepSeek with Groq
  static async generateAIResponse(userMessage: string, mode: 'general' | 'trading' = 'general'): Promise<string> {
    try {
      const session = await this.getOrCreateSession();
      const conversationHistory = session.messages
        .filter(msg => msg.id !== 'welcome')
        .map(msg => ({
          role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));
      
      // CHANGED: Use Groq instead of DeepSeek
      return await GroqService.generateResponse(userMessage, conversationHistory, mode);
    } catch (error) {
      console.error('AI Response Error:', error);
      return this.getFallbackResponse(userMessage.toLowerCase(), mode);
    }
  }

  // NEW: Enhanced method that uses your mood/pattern data with Groq
  static async generateContextualAIResponse(
    userMessage: string, 
    moodData: any[] = [], 
    patterns: any[] = [], 
    mode: 'general' | 'trading' = 'general'
  ): Promise<string> {
    try {
      const session = await this.getOrCreateSession();
      const conversationHistory = session.messages
        .filter(msg => msg.id !== 'welcome')
        .map(msg => ({
          role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));
      
      // Use Groq with rich context data
      return await GroqService.generateContextualResponse(
        userMessage, 
        moodData, 
        patterns, 
        conversationHistory, 
        mode
      );
    } catch (error) {
      console.error('AI Contextual Response Error:', error);
      return this.getFallbackResponse(userMessage.toLowerCase(), mode);
    }
  }

  static async generateMoodInsights(moodData: any[], mode: 'general' | 'trading' = 'general'): Promise<string> {
    try {
      // CHANGED: Use Groq for mood insights
      return await GroqService.generateMoodInsight(moodData, mode);
    } catch (error) {
      console.error('Mood Insight Error:', error);
      return this.getFallbackMoodInsight(moodData, mode);
    }
  }

  static async generateStressHelp(stressLevel: number, triggers: string[] = [], mode: 'general' | 'trading' = 'general'): Promise<string> {
    try {
      // CHANGED: Use Groq for stress management tips
      return await GroqService.generateStressManagementTips(stressLevel, triggers, mode);
    } catch (error) {
      console.error('Stress Help Error:', error);
      return this.getFallbackStressHelp(stressLevel, mode);
    }
  }

  static async testAPIConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // CHANGED: Test Groq connection
      const isConnected = await GroqService.testConnection();
      return {
        success: isConnected,
        message: isConnected 
          ? 'Groq connection working! ⚡ Faster & Free!'
          : 'Groq connection failed'
      };
    } catch (error) {
      console.error('Connection Test Error:', error);
      return {
        success: false,
        message: 'Failed to test Groq connection'
      };
    }
  }

  // Keep your existing fallback methods (unchanged)
  private static getFallbackResponse(userMessage: string, mode: string): string {
    const fallbacks = {
      general: [
        "I'm here to help you work through this. Can you tell me more?",
        "That sounds challenging. What's the most important aspect to focus on?",
        "I'm processing what you've shared. What would be most helpful right now?"
      ],
      trading: [
        "Trading psychology is complex. Let's break this down step by step.",
        "I understand the emotional challenge of trading. What patterns do you notice?",
        "Market emotions are normal. What's your biggest concern right now?"
      ]
    };
    
    const modeResponses = fallbacks[mode] || fallbacks.general;
    return modeResponses[Math.floor(Math.random() * modeResponses.length)];
  }

  private static getFallbackMoodInsight(moodData: any[], mode: string): string {
    if (moodData.length === 0) {
      return "Start tracking your mood regularly to get personalized insights about your emotional patterns.";
    }
    
    const recent = moodData.slice(0, 3);
    const avgMood = recent.reduce((sum, m) => sum + m.mood_score, 0) / recent.length;
    
    if (avgMood >= 7) {
      return "Your recent mood scores look positive! Keep doing what's working for you.";
    } else if (avgMood >= 5) {
      return "Your mood has been moderate. Consider what small changes might help you feel better.";
    } else {
      return "I notice your mood has been lower recently. Consider reaching out for support if you need it.";
    }
  }

  private static getFallbackStressHelp(stressLevel: number, mode: string): string {
    if (stressLevel >= 8) {
      return "High stress levels need immediate attention. Try deep breathing, take a break, and consider professional support if this continues.";
    } else if (stressLevel >= 5) {
      return "Moderate stress is manageable. Try relaxation techniques, regular exercise, or talking to someone you trust.";
    } else {
      return "Your stress levels seem manageable. Keep up your current coping strategies and maintain healthy habits.";
    }
  }
}