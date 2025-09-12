import { DeepSeekService } from '@/lib/deepseek';

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
}

export class AICoachService {
  private static storageKey = 'omi_chat_sessions';

  static async getOrCreateSession(): Promise<ChatSession> {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(this.storageKey) : null;
    let session: ChatSession;
    
    if (stored) {
      session = JSON.parse(stored);
    } else {
      session = {
        id: Date.now().toString(),
        messages: [this.getWelcomeMessage()],
        created_date: new Date().toISOString()
      };
      this.saveSession(session);
    }
    
    return session;
  }

  static async addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    const session = await this.getOrCreateSession();
    
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    session.messages.push(newMessage);
    this.saveSession(session);
    
    return newMessage;
  }

  static async generateAIResponse(userMessage: string): Promise<string> {
    try {
      // Get conversation history for context
      const session = await this.getOrCreateSession();
      const conversationHistory = session.messages
        .filter(msg => msg.id !== 'welcome') // Exclude welcome message
        .map(msg => ({
          role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));

      // Call DeepSeek API
      const response = await DeepSeekService.generateResponse(userMessage, conversationHistory);
      return response;
    } catch (error) {
      console.error('AI Response Error:', error);
      
      // Fallback to rule-based responses if API fails
      return this.getFallbackResponse(userMessage.toLowerCase());
    }
  }

  static async generateMoodInsights(moodData: any[]): Promise<string> {
    try {
      return await DeepSeekService.generateMoodInsight(moodData);
    } catch (error) {
      console.error('Mood Insight Error:', error);
      return this.getFallbackMoodInsight(moodData);
    }
  }

  static async generateStressHelp(stressLevel: number, triggers: string[] = []): Promise<string> {
    try {
      return await DeepSeekService.generateStressManagementTips(stressLevel, triggers);
    } catch (error) {
      console.error('Stress Help Error:', error);
      return this.getFallbackStressHelp(stressLevel);
    }
  }

  // Test if DeepSeek API is working
  static async testAPIConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const isConnected = await DeepSeekService.testConnection();
      return {
        success: isConnected,
        message: isConnected 
          ? 'DeepSeek API connection successful!' 
          : 'DeepSeek API connection failed. Check your API key.'
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static saveSession(session: ChatSession): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(session));
    }
  }

  private static getWelcomeMessage(): ChatMessage {
    return {
      id: 'welcome',
      type: 'ai',
      content: "Hi! I'm your personal mood and psychology coach, powered by DeepSeek AI. I'm here to help you understand your emotional patterns, manage stress, and optimize your mental well-being.\n\nI can help you with mood tracking insights, stress management techniques, building confidence, and developing healthy psychological habits. What's on your mind today?",
      timestamp: new Date().toISOString()
    };
  }

  // Fallback responses if API fails
  private static getFallbackResponse(userMessage: string): string {
    if (userMessage.includes('stress') || userMessage.includes('anxiety')) {
      return "I understand you're feeling stressed. Here are some quick techniques that can help:\n\n• Try the 4-7-8 breathing technique (inhale 4, hold 7, exhale 8)\n• Take a brief walk if possible\n• Practice progressive muscle relaxation\n• Use grounding techniques (name 5 things you see, 4 you hear, etc.)\n\nWhat specific situation is causing you stress right now?";
    }
    
    if (userMessage.includes('sad') || userMessage.includes('down') || userMessage.includes('depressed')) {
      return "I hear that you're feeling down. It's okay to have these feelings - they're a normal part of life. Some gentle approaches that might help:\n\n• Allow yourself to feel the emotion without judgment\n• Do one small thing that usually brings you comfort\n• Reach out to someone you trust\n• Practice self-compassion - talk to yourself like you would a good friend\n\nWhat do you think might help you feel a little better today?";
    }
    
    if (userMessage.includes('confidence') || userMessage.includes('doubt')) {
      return "Confidence can be tricky - it comes and goes naturally. Here are some ways to build stable self-trust:\n\n• Write down 3 recent accomplishments you're proud of\n• Notice your strengths - what do others appreciate about you?\n• Celebrate small wins throughout your day\n• Practice kind self-talk when you make mistakes\n\nWhat's one area where you'd like to feel more confident?";
    }
    
    return "Thank you for sharing that with me. I'm here to support you with whatever you're going through. Sometimes just talking about our thoughts and feelings can be really helpful.\n\nWhat's the most important thing on your mind right now? I'm here to listen and help however I can.";
  }

  private static getFallbackMoodInsight(moodData: any[]): string {
    if (!moodData.length) {
      return "Start tracking your mood regularly to discover patterns and insights that can help improve your emotional well-being. Even a few data points can reveal helpful trends!";
    }

    const recent = moodData.slice(0, 7);
    const avgMood = recent.reduce((sum, entry) => sum + entry.mood_score, 0) / recent.length;
    const avgStress = recent.reduce((sum, entry) => sum + entry.stress_level, 0) / recent.length;
    
    let insight = `Based on your recent ${recent.length} mood entries:\n\n`;
    
    if (avgMood >= 7) {
      insight += "• Your mood has been quite positive lately! This is wonderful - keep up whatever you're doing that's working for you.\n";
    } else if (avgMood >= 5) {
      insight += "• Your mood appears to be in a moderate range, which is completely normal.\n";
    } else {
      insight += "• I notice your recent mood scores are on the lower side. Remember that this is temporary, and there are strategies we can work on together.\n";
    }
    
    if (avgStress >= 7) {
      insight += "• Your stress levels seem elevated. Consider incorporating more stress-reduction activities into your routine.\n";
    } else if (avgStress <= 3) {
      insight += "• Your stress levels look well-managed - great job taking care of yourself!\n";
    }
    
    insight += "\nConsistent mood tracking helps identify patterns over time. Keep logging your emotions to gain deeper insights!";
    
    return insight;
  }

  private static getFallbackStressHelp(stressLevel: number): string {
    if (stressLevel >= 8) {
      return "That's a high stress level. Here are some immediate techniques to help:\n\n• Focus on deep, slow breathing\n• Try the 5-4-3-2-1 grounding technique\n• Step away from stressful situations if possible\n• Consider talking to someone you trust\n• Remember: this feeling will pass\n\nIf you're consistently experiencing high stress, consider speaking with a counselor or therapist.";
    } else if (stressLevel >= 5) {
      return "Moderate stress is manageable with the right techniques:\n\n• Take short breaks throughout your day\n• Practice mindfulness or meditation\n• Get some physical activity\n• Organize your tasks to feel more in control\n• Make sure you're getting enough sleep\n\nWhat usually helps you feel more relaxed?";
    } else {
      return "Your stress level seems manageable right now, which is great! Here are some ways to maintain this:\n\n• Keep up your current coping strategies\n• Stay aware of early stress warning signs\n• Maintain healthy habits like good sleep and exercise\n• Practice gratitude for the calm moments\n\nWhat's been helping you stay relatively calm lately?";
    }
  }
}