// src/lib/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for client-side usage
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenAIService {
  private static systemPrompt = `You are a compassionate and knowledgeable mood and psychology coach. Your role is to:

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

Remember: You're not a replacement for professional therapy, but a supportive companion for daily emotional wellness.`;

  static async generateResponse(
    userMessage: string, 
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: this.systemPrompt },
        ...conversationHistory.slice(-10), // Keep last 10 messages for context
        { role: 'user', content: userMessage }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      return completion.choices[0]?.message?.content || 
             "I'm sorry, I'm having trouble responding right now. Please try again.";
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  static async generateMoodInsight(moodData: any[]): Promise<string> {
    try {
      const moodSummary = this.analyzeMoodData(moodData);
      
      const prompt = `Based on this mood tracking data, provide personalized insights and recommendations:

${moodSummary}

Please provide:
1. Key patterns you notice
2. Specific recommendations for improvement
3. Encouragement based on positive trends
4. Gentle suggestions for areas that need attention

Keep it supportive and actionable.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 400,
        temperature: 0.6,
      });

      return completion.choices[0]?.message?.content || 
             "Unable to generate mood insights at this time.";
    } catch (error) {
      console.error('OpenAI Mood Insight Error:', error);
      throw new Error('Failed to generate mood insights');
    }
  }

  private static analyzeMoodData(moodData: any[]): string {
    if (!moodData.length) return "No mood data available.";

    const recent = moodData.slice(0, 7); // Last 7 entries
    const avgMood = recent.reduce((sum, entry) => sum + entry.mood_score, 0) / recent.length;
    const avgStress = recent.reduce((sum, entry) => sum + entry.stress_level, 0) / recent.length;
    const avgEnergy = recent.reduce((sum, entry) => sum + entry.energy_level, 0) / recent.length;
    const avgConfidence = recent.reduce((sum, entry) => sum + entry.trading_confidence, 0) / recent.length;

    return `Recent mood analysis (last ${recent.length} entries):
- Average mood score: ${avgMood.toFixed(1)}/10
- Average stress level: ${avgStress.toFixed(1)}/10  
- Average energy level: ${avgEnergy.toFixed(1)}/10
- Average confidence: ${avgConfidence.toFixed(1)}/10

Recent entries: ${recent.map(entry => 
  `${entry.created_date?.split('T')[0]}: Mood ${entry.mood_score}, Stress ${entry.stress_level}, Energy ${entry.energy_level}`
).join('; ')}`;
  }
}

// src/lib/anthropic.ts (Alternative)
export class AnthropicService {
  private static apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  private static apiUrl = 'https://api.anthropic.com/v1/messages';

  static async generateResponse(userMessage: string): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `You are a compassionate mood and psychology coach. Help the user with their emotional well-being: ${userMessage}`
          }]
        })
      });

      const data = await response.json();
      return data.content[0].text || "I'm having trouble responding right now.";
    } catch (error) {
      console.error('Anthropic API Error:', error);
      throw new Error('Failed to generate AI response');
    }
  }
}