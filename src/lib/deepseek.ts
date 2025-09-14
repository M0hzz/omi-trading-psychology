export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class DeepSeekService {
  private static apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
  private static apiUrl = 'https://api.deepseek.com/v1/chat/completions';
  
  private static systemPrompts = {
    general: `You are a compassionate and knowledgeable mood and psychology coach. Your role is to:
1. Help users understand their emotional patterns and triggers
2. Provide evidence-based stress management techniques
3. Support users through difficult emotions with empathy
4. Encourage self-compassion and healthy coping strategies
5. Help users build confidence and emotional resilience
Guidelines:
- Always be supportive, non-judgmental, and empathetic
- Focus on emotional well-being rather than trading/financial advice
- Provide practical, actionable suggestions
- Encourage professional help when appropriate
- Use a warm, understanding tone
- Keep responses conversational and accessible
- Limit responses to 2-3 paragraphs for better readability
Remember: You're not a replacement for professional therapy, but a supportive companion for daily emotional wellness.`,
    
    trading: `You are an expert trading psychology coach. Your role is to:
1. Help traders understand their emotional patterns in trading contexts
2. Provide evidence-based stress management techniques for trading environments
3. Support traders through difficult market emotions with empathy
4. Encourage self-compassion and healthy trading psychology habits
5. Help traders build confidence and emotional resilience in their trading journey
Guidelines:
- Always be supportive, non-judgmental, and empathetic
- Focus on trading psychology and market behavior
- Provide practical, actionable trading psychology advice
- Encourage professional help when appropriate
- Use a warm, understanding tone
- Keep responses conversational and accessible
- Limit responses to 2-3 paragraphs for better readability
Remember: You're not a replacement for professional financial advice, but a supportive companion for trading psychology.`
  };
  
  static async generateResponse(
    userMessage: string, 
    conversationHistory: ChatMessage[] = [],
    mode: 'general' | 'trading' = 'general'
  ): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('DeepSeek API key not configured');
      }
      
      const systemPrompt = this.systemPrompts[mode];
      
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10), // Keep last 10 messages for context
        { role: 'user', content: userMessage }
      ];
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
          stream: false
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('DeepSeek API Error:', response.status, errorData);
        throw new Error(`DeepSeek API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.choices?.[0]?.message?.content?.trim() || 
             "I'm sorry, I'm having trouble responding right now. Please try again.";
             
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      throw new Error('Failed to generate AI response');
    }
  }
  
  static async generateMoodInsight(moodData: any[], mode: 'general' | 'trading' = 'general'): Promise<string> {
    try {
      const moodSummary = this.analyzeMoodData(moodData, mode);
      
      const prompt = mode === 'trading' 
        ? `As a trading psychology coach, analyze this mood tracking data and provide personalized insights for trading:
${moodSummary}
Please provide:
1. Key emotional patterns affecting trading decisions
2. Specific recommendations for improving trading psychology
3. Encouragement based on positive trading trends
4. Gentle suggestions for areas that need attention in trading
Keep your response supportive, actionable, and focused on trading psychology.`
        : `As a mood and psychology coach, analyze this mood tracking data and provide personalized insights:
${moodSummary}
Please provide:
1. Key emotional patterns you notice
2. Specific recommendations for improving mood and well-being
3. Encouragement based on positive trends
4. Gentle suggestions for areas that need attention
Keep your response supportive, actionable, and focused on emotional wellness (not trading).`;
      
      const response = await this.generateResponse(prompt, [], mode);
      return response;
      
    } catch (error) {
      console.error('DeepSeek Mood Insight Error:', error);
      throw new Error('Failed to generate mood insights');
    }
  }
  
  static async generateStressManagementTips(stressLevel: number, triggers: string[], mode: 'general' | 'trading' = 'general'): Promise<string> {
    try {
      const prompt = mode === 'trading'
        ? `A trader is experiencing stress level ${stressLevel}/10. Their main trading triggers are: ${triggers.join(', ')}.
As their trading psychology coach, provide specific, practical stress management techniques tailored to trading:
1. Immediate coping strategies for trading sessions
2. Long-term trading psychology improvement techniques  
3. Ways to manage trading-specific triggers
4. Encouragement and validation for trading challenges
Keep it supportive and actionable for trading contexts.`
        : `A user is experiencing stress level ${stressLevel}/10. Their main triggers are: ${triggers.join(', ')}.
As their mood coach, provide specific, practical stress management techniques tailored to their situation:
1. Immediate coping strategies
2. Long-term stress reduction techniques  
3. Ways to manage their specific triggers
4. Encouragement and validation
Keep it supportive and actionable.`;
      
      return await this.generateResponse(prompt, [], mode);
    } catch (error) {
      console.error('DeepSeek Stress Tips Error:', error);
      throw new Error('Failed to generate stress management tips');
    }
  }
  
  private static analyzeMoodData(moodData: any[], mode: 'general' | 'trading' = 'general'): string {
    if (!moodData.length) return "No mood data available for analysis.";
    
    const recent = moodData.slice(0, 7); // Last 7 entries
    
    // Calculate averages
    const avgMood = recent.reduce((sum, entry) => sum + entry.mood_score, 0) / recent.length;
    const avgStress = recent.reduce((sum, entry) => sum + entry.stress_level, 0) / recent.length;
    const avgEnergy = recent.reduce((sum, entry) => sum + entry.energy_level, 0) / recent.length;
    
    // Conditionally include trading confidence only in trading mode
    const avgConfidence = mode === 'trading' && recent[0]?.trading_confidence !== undefined
      ? recent.reduce((sum, entry) => sum + entry.trading_confidence, 0) / recent.length
      : null;
    
    // Get common tags
    const allTags = recent.flatMap(entry => entry.tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const commonTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);
    
    // Build analysis string
    let analysis = `Recent mood analysis (last ${recent.length} entries):
- Average mood score: ${avgMood.toFixed(1)}/10
- Average stress level: ${avgStress.toFixed(1)}/10  
- Average energy level: ${avgEnergy.toFixed(1)}/10`;
    
    if (avgConfidence !== null) {
      analysis += `\n- Average trading confidence: ${avgConfidence.toFixed(1)}/10`;
    }
    
    analysis += `\n- Common emotional tags: ${commonTags.join(', ')}
Daily breakdown: ${recent.map(entry => {
  const date = entry.created_date?.split('T')[0] || 'Unknown date';
  return `${date}: Mood ${entry.mood_score}, Stress ${entry.stress_level}, Energy ${entry.energy_level}`;
}).join('; ')}
Recent notes: ${recent
  .filter(entry => entry.notes?.trim())
  .slice(0, 2)
  .map(entry => `"${entry.notes.substring(0, 50)}${entry.notes.length > 50 ? '...' : ''}"`)
  .join('; ')}`;
    
    return analysis;
  }
  
  // Health check method
  static async testConnection(): Promise<boolean> {
    try {
      const response = await this.generateResponse("Hello, this is a test message.");
      return response.length > 0;
    } catch (error) {
      console.error('DeepSeek connection test failed:', error);
      return false;
    }
  }
}