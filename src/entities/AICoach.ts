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
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    // Simple rule-based responses (in real app, this would be an LLM API call)
    const responses = this.getContextualResponse(userMessage.toLowerCase());
    
    return responses[Math.floor(Math.random() * responses.length)];
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
      content: "Hi! I'm your AI Trading Psychology Coach. I'm here to help you understand your psychological patterns, manage trading stress, and optimize your mental performance.\n\nI have access to your mood history, current market sentiment, and behavioral patterns. What would you like to discuss today?",
      timestamp: new Date().toISOString()
    };
  }

  private static getContextualResponse(userMessage: string): string[] {
    if (userMessage.includes('stress') || userMessage.includes('anxiety')) {
      return [
        "I understand you're experiencing stress. Based on your recent mood data, I notice stress levels tend to spike during high volatility periods. Here are some strategies:\n\n• Take 3 deep breaths before making any trading decisions\n• Reduce position sizes when VIX > 25\n• Consider implementing a 15-minute cool-down period after any loss\n• Practice progressive muscle relaxation between trading sessions\n\nWould you like me to guide you through a quick stress-reduction technique?",
        "Stress is a natural part of trading, but we can manage it better. Your patterns show stress increases by 40% during market volatility. Try this approach:\n\n• Set strict stop-losses before entering trades\n• Use the 4-7-8 breathing technique (inhale 4, hold 7, exhale 8)\n• Take breaks every 2 hours during active trading\n• Review your wins, not just losses, to maintain confidence\n\nWhat specific situations trigger your stress the most?"
      ];
    }
    
    if (userMessage.includes('confidence') || userMessage.includes('doubt')) {
      return [
        "Confidence fluctuations are normal in trading. Your data shows confidence peaks mid-week and drops on Mondays. Here's how to maintain steady confidence:\n\n• Keep a trading journal to track successful decisions\n• Review your edge and strategy regularly\n• Set realistic daily goals, not just profit targets\n• Practice visualization of successful trades\n\nRemember, overconfidence can be as dangerous as underconfidence. What's affecting your confidence today?",
        "I see confidence is on your mind. Your pattern analysis shows you perform best when confidence is between 6-8/10. Too high leads to risky decisions, too low leads to missed opportunities.\n\n• Start each day reviewing your trading plan\n• Use smaller position sizes when confidence is low\n• Celebrate small wins to build momentum\n• Focus on process, not just outcomes\n\nHow would you rate your confidence level right now on a 1-10 scale?"
      ];
    }
    
    if (userMessage.includes('pattern') || userMessage.includes('behavior')) {
      return [
        "Great question about patterns! I've detected several key patterns in your trading psychology:\n\n• **Circadian Pattern**: Mood dips 2-4 PM (87% confidence)\n• **Market Correlation**: Stress spikes when VIX > 25 (93% confidence)\n• **Weekly Cycle**: Best performance Tuesday-Wednesday\n• **Loss Streak Effect**: Decision quality degrades after 2+ losses\n\nWhich pattern would you like to explore in more detail?",
        "Your behavioral patterns are fascinating! The data shows some clear trends:\n\n• Energy below 4/10 correlates with 67% higher error rates\n• Consecutive wins lead to 60% increase in risk-taking\n• Monday performance is consistently 23% below average\n\nUnderstanding these patterns gives you a significant edge. Would you like specific strategies to work with any of these patterns?"
      ];
    }
    
    if (userMessage.includes('market') || userMessage.includes('volatility')) {
      return [
        "Current market conditions are showing mixed signals. Based on recent news sentiment analysis:\n\n• Overall market sentiment: +32% (moderately bullish)\n• Technology sector leading with +68% positive sentiment\n• Energy sector facing headwinds with -40% sentiment\n• High impact news suggests continued volatility\n\nGiven your stress patterns during volatility, consider reducing position sizes and focusing on high-conviction trades. How are you feeling about the current market environment?",
        "The market intelligence data shows interesting patterns right now:\n\n• 6 positive vs 4 negative major news stories today\n• Financial sector sentiment improving (+45%)\n• Manufacturing showing weakness (-35%)\n• Fed policy creating uncertainty\n\nYour historical data shows you perform better in trending markets vs choppy conditions. Today feels more choppy, so maybe focus on smaller, faster trades or use this time for analysis. What's your read on the market?"
      ];
    }
    
    if (userMessage.includes('help') || userMessage.includes('advice')) {
      return [
        "I'm here to help optimize your trading psychology! Based on your data, here are some key areas we could work on:\n\n• **Stress Management**: Your stress levels spike during volatility\n• **Timing Optimization**: You perform best Tuesday-Wednesday\n• **Energy Management**: Low energy correlates with more errors\n• **Confidence Calibration**: Finding the sweet spot between over/under confidence\n\nWhat specific challenge would you like to tackle first?",
        "Absolutely! I can help with several aspects of your trading psychology:\n\n• Analyze your mood patterns and triggers\n• Provide stress-reduction techniques\n• Help optimize your trading schedule\n• Suggest confidence-building exercises\n• Create personalized trading rules based on your patterns\n\nWhat area of your trading psychology feels most challenging right now?"
      ];
    }
    
    // Default responses
    return [
      "That's an interesting point. Based on your psychological patterns and current market conditions, I'd recommend focusing on maintaining emotional balance while staying alert to opportunities.\n\nYour recent mood data shows you're in a good headspace for trading, but remember to stick to your predetermined risk management rules.\n\nWhat specific aspect of your trading psychology would you like to explore further?",
      "I understand what you're getting at. Your behavioral patterns suggest you're most effective when you maintain a systematic approach to trading decisions.\n\nGiven the current market sentiment (moderately bullish), this could be a good time to implement some of the strategies we've discussed.\n\nHow has your energy level been today? That tends to correlate strongly with your decision-making quality.",
      "Thanks for sharing that. Looking at your data holistically, I see some opportunities for optimization in your trading psychology approach.\n\nYour pattern analysis shows strong self-awareness, which is a huge advantage. The key is translating that awareness into actionable strategies.\n\nWould you like me to suggest some specific techniques based on your unique psychological profile?"
    ];
  }
}