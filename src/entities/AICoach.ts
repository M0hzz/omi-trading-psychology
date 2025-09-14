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
      const session = await this.getOrCreateSession();
      const conversationHistory = session.messages
        .filter(msg => msg.id !== 'welcome')
        .map(msg => ({
          role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));
      
      return await DeepSeekService.generateResponse(userMessage, conversationHistory);
    } catch (error) {
      console.error('AI Response Error:', error);
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

  private static saveSession(session: ChatSession): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(session));
    }
  }

  private static getWelcomeMessage(): ChatMessage {
    return {
      id: 'welcome',
      type: 'ai',
      content: "Hey there! 👋 I'm your personal mood coach, powered by DeepSeek AI. I'm here to help you understand your emotions, manage stress, and feel better about life.\n\nNeed mood insights? Stress tips? Just want to chat? I've got your back! What's on your mind today?",
      timestamp: new Date().toISOString()
    };
  }

  private static getFallbackResponse(userMessage: string): string {
    if (userMessage.includes('stress') || userMessage.includes('anxiety')) {
      return "Stress sucks, right? 😩 Here are some quick fixes:\n\n• Try 4-7-8 breathing (inhale 4, hold 7, exhale 8)\n• Take a quick walk outside\n• Squeeze and release your muscles\n• Name 5 things you see, 4 you hear, etc.\n\nWhat's stressing you out right now?";
    }
    
    if (userMessage.includes('sad') || userMessage.includes('down') || userMessage.includes('depressed')) {
      return "Feeling down is totally okay - we all have those days. 💙 Here's what might help:\n\n• Give yourself permission to feel this way\n• Do one small thing that usually makes you smile\n• Text a friend if you feel up for it\n• Be kind to yourself like you'd be to a good friend\n\nWhat usually helps when you're feeling blue?";
    }
    
    if (userMessage.includes('confidence') || userMessage.includes('doubt')) {
      return "Confidence can be tricky! Here are some quick confidence boosters:\n\n• Write down 3 things you rocked this week\n• Ask a friend what they like about you\n• Celebrate tiny wins\n• Practice talking to yourself like your own best friend\n\nWhere would you like to feel more confident?";
    }
    
    return "Thanks for sharing that with me! 🌟 Just talking about stuff can help a lot. What's the biggest thing on your mind right now? I'm here to listen however I can.";
  }

  private static getFallbackMoodInsight(moodData: any[]): string {
    if (!moodData.length) {
      return "Start tracking your mood to see patterns! Even a few entries can show you what's working for you ✨";
    }
    
    const recent = moodData.slice(0, 7);
    const avgMood = recent.reduce((sum, entry) => sum + entry.mood_score, 0) / recent.length;
    const avgStress = recent.reduce((sum, entry) => sum + entry.stress_level, 0) / recent.length;
    
    let insight = `Looking at your last ${recent.length} mood entries:\n\n`;
    
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
    
    return insight;
  }

  private static getFallbackStressHelp(stressLevel: number): string {
    if (stressLevel >= 8) {
      return "Whoa, that's a lot of stress! 😱 Quick help:\n\n• Breathe slowly and deeply\n• Try naming 5 things you can see\n• Step away from the situation if you can\n• Text someone you trust\n• Remember: this feeling will pass\n\nIf this keeps happening, maybe chat with a counselor?";
    } else if (stressLevel >= 5) {
      return "Stress's kinda kicking in, huh? Here's what might help:\n\n• Take little breaks throughout your day\n• Try a quick 5-minute meditation\n• Move your body a bit\n• Make a to-do list to feel more in control\n• Get some good sleep tonight\n\nWhat usually helps you chill out?";
    } else {
      return "You're doing pretty good with stress! 🌟 Keep it up with:\n\n• Your current chill methods\n• Watching for early stress signs\n• Keeping up those healthy habits\n• Being grateful for the calm moments\n\nWhat's been helping you stay relaxed lately?";
    }
  }
}