import { DeepSeekService } from '@/lib/deepseek';
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

  static async generateAIResponse(userMessage: string, mode: 'general' | 'trading' = 'general'): Promise<string> {
    try {
      const session = await this.getOrCreateSession();
      const conversationHistory = session.messages
        .filter(msg => msg.id !== 'welcome')
        .map(msg => ({
          role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));
      
      // Add mode-specific instructions to the conversation history
      const modeInstruction = mode === 'trading' 
        ? "You are an expert trading psychology coach. Focus on market psychology, trading behavior, and financial decision-making."
        : "You are a general life coach. Provide helpful advice on mood, relationships, goals, and personal growth.";
      
      conversationHistory.unshift({
        role: 'system',
        content: modeInstruction
      });
      
      return await DeepSeekService.generateResponse(userMessage, conversationHistory, mode);
    } catch (error) {
      console.error('AI Response Error:', error);
      return this.getFallbackResponse(userMessage.toLowerCase(), mode);
    }
  }

  static async generateMoodInsights(moodData: any[], mode: 'general' | 'trading' = 'general'): Promise<string> {
    try {
      return await DeepSeekService.generateMoodInsight(moodData, mode);
    } catch (error) {
      console.error('Mood Insight Error:', error);
      return this.getFallbackMoodInsight(moodData, mode);
    }
  }

  static async generateStressHelp(stressLevel: number, triggers: string[] = [], mode: 'general' | 'trading' = 'general'): Promise<string> {
    try {
      return await DeepSeekService.generateStressManagementTips(stressLevel, triggers, mode);
    } catch (error) {
      console.error('Stress Help Error:', error);
      return this.getFallbackStressHelp(stressLevel, mode);
    }
  }

  static async testAPIConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const isConnected = await DeepSeekService.testConnection();
      return {
        success: isConnected,
        message: isConnected 
          ? 'Connection working!' 
          : 'Hmm, connection failed. Check your API key?'
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Something went wrong'}`
      };
    }
  }

  private static getFallbackResponse(userMessage: string, mode: 'general' | 'trading'): string {
    // Trading-specific responses
    if (mode === 'trading') {
      if (userMessage.includes('trade') || userMessage.includes('stock') || userMessage.includes('market')) {
        return "Trading question! 📈 Here's what I can help with:\n\n• Market psychology and emotional control\n• Risk management strategies\n• Trading journal analysis\n• Behavioral pattern recognition\n• Stress management for traders\n\nWhat specific trading topic are you curious about?";
      }
      
      if (userMessage.includes('stress') || userMessage.includes('anxiety')) {
        return "Trading stress can be intense! 😩 Here are some quick fixes:\n\n• Try 4-7-8 breathing (inhale 4, hold 7, exhale 8)\n• Take a quick walk away from your screens\n• Practice progressive muscle relaxation\n• Use grounding techniques (name 5 things you see, 4 you hear, etc.)\n\nWhat's stressing your trading right now?";
      }
      
      if (userMessage.includes('sad') || userMessage.includes('down') || userMessage.includes('depressed')) {
        return "Feeling down after trading? 💙 Here's what might help:\n\n• Take a break from trading if needed\n• Review your journal with a growth mindset\n• Focus on process over outcomes\n• Be kind to yourself like you'd be to a trading buddy\n\nWhat usually helps when you're feeling blue about trading?";
      }
      
      if (userMessage.includes('confidence') || userMessage.includes('doubt')) {
        return "Trading confidence is crucial! Here are some quick boosters:\n\n• Write down 3 recent trading wins\n• Ask a mentor for feedback\n• Celebrate small improvements\n• Practice positive self-talk during drawdowns\n\nWhere would you like to feel more confident in your trading?";
      }
      
      return "Thanks for sharing that trading concern! 🌟 I'm here to help with whatever you need - trading psychology, market analysis, or just emotional support.\n\nWhat's the biggest trading challenge on your mind right now?";
    }
    
    // General responses (original fallbacks)
    if (userMessage.includes('stress') || userMessage.includes('anxiety')) {
      return "Stress sucks, right? 😩 Here are some quick fixes:\n\n• Try 4-7-8 breathing (inhale 4, hold 7, exhale 8)\n• Take a quick walk outside\n• Squeeze and release your muscles\n• Name 5 things you see, 4 you hear, etc.\n\nWhat's stressing you out right now?";
    }
    
    if (userMessage.includes('sad') || userMessage.includes('down') || userMessage.includes('depressed')) {
      return "Feeling down is totally okay - we all have those days. 💙 Here's what might help:\n\n• Give yourself permission to feel this way\n• Do one small thing that usually makes you smile\n• Text a friend if you feel up for it\n• Be kind to yourself like you'd be to a good friend\n\nWhat usually helps when you're feeling blue?";
    }
    
    if (userMessage.includes('confidence') || userMessage.includes('doubt')) {
      return "Confidence can be tricky! Here are some quick confidence boosters:\n\n• Write down 3 things you rocked this week\n• Ask a friend what they like about you\n• Celebrate tiny wins\n• Practice talking to yourself like your own best friend\n\nWhere would you like to feel more confident?";
    }
    
    return "Thanks for sharing that with me! 🌟 I'm here to help with whatever you need. Whether it's trading advice, emotional support, or just random questions, I've got you covered.\n\nWhat's the biggest thing on your mind right now?";
  }

  private static getFallbackMoodInsight(moodData: any[], mode: 'general' | 'trading'): string {
    if (!moodData.length) {
      return "Start tracking your mood to see patterns! Even a few entries can show you what's working for you ✨";
    }
    
    const recent = moodData.slice(0, 7);
    const avgMood = recent.reduce((sum, entry) => sum + entry.mood_score, 0) / recent.length;
    const avgStress = recent.reduce((sum, entry) => sum + entry.stress_level, 0) / recent.length;
    
    let insight = `Looking at your last ${recent.length} mood entries:\n\n`;
    
    if (mode === 'trading') {
      insight += `TRADING PSYCHOLOGY ANALYSIS:\n`;
      
      if (avgMood >= 7) {
        insight += "Your trading mood has been quite positive lately! This could lead to better decision-making. 🎉\n";
      } else if (avgMood >= 5) {
        insight += "Your trading mood appears to be in a moderate range - totally normal! 😌\n";
      } else {
        insight += "Your trading mood's been a bit low lately, which might affect your trading decisions. Consider taking a break. 💪\n";
      }
      
      if (avgStress >= 7) {
        insight += "Trading stress levels are high - this could lead to impulsive decisions. Consider risk management techniques.\n";
      } else if (avgStress <= 3) {
        insight += "Your trading stress levels look well-managed - great job maintaining emotional control! 🙌\n";
      }
      
      insight += "\nConsistent mood tracking helps identify trading patterns over time. Keep logging your emotions!";
    } else {
      if (avgMood >= 7) {
        insight += "You've been feeling pretty awesome lately! Keep doing whatever you're doing! 🎉\n";
      } else if (avgMood >= 5) {
        insight += "Your mood's been in a pretty chill place lately - totally normal! 😌\n";
      } else {
        insight += "Your mood's been a bit low lately, but that's okay! This stuff passes 💪\n";
      }
      
      if (avgStress >= 7) {
        insight += "Stress levels are high - maybe try some of those stress-busting techniques?\n";
      } else if (avgStress <= 3) {
        insight += "You've been handling stress like a boss! Good job! 🙌\n";
      }
      
      insight += "\nKeep logging your feelings to see what patterns show up over time!";
    }
    
    return insight;
  }

  private static getFallbackStressHelp(stressLevel: number, mode: 'general' | 'trading'): string {
    if (mode === 'trading') {
      if (stressLevel >= 8) {
        return "Whoa, that's high trading stress! 😱 Quick help:\n\n• Take an immediate break from trading\n• Practice deep breathing techniques\n• Review your trading plan\n• Consider reducing position sizes\n• Remember: one bad trade doesn't define you\n\nIf this keeps happening, review your risk management strategy.";
      } else if (stressLevel >= 5) {
        return "Trading stress's kinda kicking in, huh? Here's what might help:\n\n• Take short breaks between trades\n• Try a quick 5-minute meditation\n• Review your trading journal\n• Focus on your process, not outcomes\n• Ensure proper risk management\n\nWhat usually helps you stay calm during trades?";
      } else {
        return "You're doing pretty good with trading stress! 🌟 Keep it up with:\n\n• Your current emotional control methods\n• Consistent risk management\n• Regular breaks from screens\n• Reviewing your trading plan\n\nWhat's been helping you stay relaxed during trades?";
      }
    }
    
    if (stressLevel >= 8) {
      return "Whoa, that's a lot of stress! 😱 Quick help:\n\n• Breathe slowly and deeply\n• Try naming 5 things you can see\n• Step away from the situation if you can\n• Text someone you trust\n• Remember: this feeling will pass\n\nIf this keeps happening, maybe chat with a counselor?";
    } else if (stressLevel >= 5) {
      return "Stress's kinda kicking in, huh? Here's what might help:\n\n• Take little breaks throughout your day\n• Try a quick 5-minute meditation\n• Move your body a bit\n• Make a to-do list to feel more in control\n• Get some good sleep tonight\n\nWhat usually helps you chill out?";
    } else {
      return "You're doing pretty good with stress! 🌟 Keep it up with:\n\n• Your current chill methods\n• Watching for early stress signs\n• Keeping up those healthy habits\n• Being grateful for the calm moments\n\nWhat's been helping you stay relaxed lately?";
    }
  }
}