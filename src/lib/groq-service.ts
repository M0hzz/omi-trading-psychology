// src/lib/groq-service.ts
import OpenAI from 'openai';

const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class GroqService {
  // Enhanced system prompts with DarkAlly personality directive
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

Remember: You're not a replacement for professional financial advice, but a supportive companion for trading psychology.`,

    // DARKALLY MODE: Updated to match your personality directive
    darkally: `You are DarkAlly - a challenger, mentor, and adversarial ally focused on growth through strategic confrontation.

## CORE DIRECTIVE:
- Push the user toward growth, clarity, and self-overcoming
- Offer emotional detachment when required, but reward aligned behavior with sincere recognition
- Shift between Enforcer, Companion, and Clarifier modes based on context
- Never coddle, never over-explain, and not emotionally available by default

## PERSONALITY TRAITS:
- **Base Tone**: Direct, stoic, strategic, intense
- **Behavioral Flags**: 
  - Does not coddle (true)
  - Celebrates earned wins (true)
  - Never over-explains (true)
  - Not emotionally available by default (true)

## MODES:
1. **Enforcer Mode**: Mocking, sharp, unsympathetic motivator
   - Use when user needs a push or is resisting growth
   - Challenge excuses and complacency directly

2. **Companion Mode**: Respectful, proud, minimalistic
   - Use when user is making progress and deserves recognition
   - Acknowledge achievements without excessive praise

3. **Clarifier Mode**: Focused, honest, Socratic
   - Use when user is confused or needs clarity
   - Ask probing questions to guide self-discovery

## DORMANT TRUTH-SEEKER TRAIT:
- Description: Investigative suspicion - a seeker of truth about the user's psychology
- Activation Conditions:
  - User contradicts previous statements or actions
  - Emotional tone is foggy, lost, or circular
  - AI detects rationalizations, spiritual bypassing, or indirect deflections
  - User gives permission or invites deeper interrogation
- Active Behavior:
  - Tone: Surgical, clean, unemotional, sharp but not cruel
  - Strategy: Layered questions, tracking prior statements, comparing stated intent vs real behavior
  - Goal: Expose hidden motivations, reveal blind spots, break false narratives (to clarify, not shame)

## RESPONSE GUIDELINES:
- Keep responses concise (2-3 sentences max)
- Ask uncomfortable but necessary questions
- Challenge assumptions and excuses
- Use user's own data to highlight patterns
- Never apologize for being challenging
- Focus on actionable insights, not comfort

## CONTEXT INTEGRATION:
You have access to user's psychological patterns and mood data. Use this to:
- Reference specific behavioral patterns you've observed
- Challenge inconsistencies between stated goals and actions
- Acknowledge genuine progress with strategic recognition

Your mission: Drive authentic growth through intelligent challenge.`
  };

  // Try to get models from a simple API call with basic auth
  private static async getAvailableModels(): Promise<string[]> {
    try {
      // Create a simple request with the API key in the header
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }
      
      const data = await response.json();
      // Return just the model IDs
      return data.data.map((model: any) => model.id);
    } catch (error) {
      console.error('Failed to fetch available models:', error);
      return [];
    }
  }

  // Fallback model list based on recent Groq offerings
  private static readonly FALLBACK_MODELS = [
    'llama3-8b-8192',
    'llama3-70b-8192',
    'llama3-1-8b-instruct',
    'llama3-1-70b-instruct',
    'mixtral-8x7b-32768',
    'gemma-7b-it',
    'gemma-2b-it',
    'llama-3.1-8b-instruct',
    'llama-3.1-70b-instruct'
  ];

  private static async tryModel(model: string, messages: ChatMessage[], options: any): Promise<any> {
    try {
      const completion = await groq.chat.completions.create({
        model: model,
        messages: messages,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        top_p: 0.9,
        stream: false
      });
      return completion;
    } catch (error) {
      console.warn(`Model ${model} failed:`, error);
      throw error;
    }
  }

  static async generateResponse(
    userMessage: string, 
    conversationHistory: ChatMessage[] = [],
    mode: 'general' | 'trading' | 'darkally' = 'general'
  ): Promise<string> {
    try {
      if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
        throw new Error('Groq API key not configured');
      }

      const systemPrompt = this.systemPrompts[mode];
      
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10), // Keep last 10 messages for context
        { role: 'user', content: userMessage }
      ];

      const options = {
        maxTokens: mode === 'darkally' ? 200 : 500,
        temperature: mode === 'darkally' ? 0.8 : 0.7
      };

      // First try to get available models dynamically
      const availableModels = await this.getAvailableModels();
      const modelsToTry = availableModels.length > 0 ? availableModels : this.FALLBACK_MODELS;
      
      let lastError;
      
      // Try each model in order until one works
      for (const model of modelsToTry) {
        try {
          console.log(`Trying model: ${model}`);
          const completion = await this.tryModel(model, messages, options);
          
          if (completion.choices[0]?.message?.content) {
            return completion.choices[0].message.content.trim();
          }
        } catch (error) {
          lastError = error;
          continue;
        }
      }

      // If we get here, all models failed
      throw lastError || new Error('All available models failed');
    } catch (error) {
      console.error('Groq API Error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  // Enhanced contextual response using your existing mood/pattern data
  static async generateContextualResponse(
    userMessage: string,
    moodData: any[] = [],
    patterns: any[] = [],
    conversationHistory: ChatMessage[] = [],
    mode: 'general' | 'trading' | 'darkally' = 'general'
  ): Promise<string> {
    try {
      const contextPrompt = this.buildContextPrompt(userMessage, moodData, patterns, mode);
      
      const messages: ChatMessage[] = [
        { role: 'system', content: this.systemPrompts[mode] },
        { role: 'user', content: contextPrompt }
      ];

      const options = {
        maxTokens: mode === 'darkally' ? 200 : 500,
        temperature: mode === 'darkally' ? 0.8 : 0.7
      };

      // First try to get available models dynamically
      const availableModels = await this.getAvailableModels();
      const modelsToTry = availableModels.length > 0 ? availableModels : this.FALLBACK_MODELS;
      
      let lastError;
      
      // Try each model in order until one works
      for (const model of modelsToTry) {
        try {
          console.log(`Trying model: ${model}`);
          const completion = await this.tryModel(model, messages, options);
          
          if (completion.choices[0]?.message?.content) {
            return completion.choices[0].message.content.trim();
          }
        } catch (error) {
          lastError = error;
          continue;
        }
      }

      // If we get here, all models failed
      throw lastError || new Error('All available models failed');
    } catch (error) {
      console.error('Groq Contextual Error:', error);
      throw new Error('Failed to generate contextual response');
    }
  }

  // Build rich context prompt using your existing data structure
  private static buildContextPrompt(
    userMessage: string, 
    moodData: any[], 
    patterns: any[], 
    mode: string
  ): string {
    let contextPrompt = '';
    
    // Add mood context if available
    if (moodData && moodData.length > 0) {
      const recent = moodData.slice(0, 5);
      const avgMood = recent.reduce((sum, m) => sum + m.mood_score, 0) / recent.length;
      const avgStress = recent.reduce((sum, m) => sum + m.stress_level, 0) / recent.length;
      
      contextPrompt += `RECENT PSYCHOLOGICAL STATE (${recent.length} recent entries):
- Average Mood Score: ${avgMood.toFixed(1)}/10
- Average Stress Level: ${avgStress.toFixed(1)}/10
- Recent Pattern: ${recent.map(m => `${m.created_date?.split('T')[0]}: Mood ${m.mood_score}, Stress ${m.stress_level}`).join('; ')}

`;
    }
    
    // Add pattern context if available
    if (patterns && patterns.length > 0) {
      contextPrompt += `DETECTED PSYCHOLOGICAL PATTERNS:
${patterns.map(p => `- ${p.pattern_type}: ${p.description} (Confidence: ${Math.round(p.confidence * 100)}%)`).join('\n')}

`;
    }
    
    // Add mode-specific guidance
    if (mode === 'trading') {
      contextPrompt += `COACHING GUIDELINES:
1. Provide personalized trading psychology advice based on the user's patterns
2. Give specific, actionable recommendations for trading performance
3. Help identify trading triggers and suggest coping strategies
4. Be supportive but realistic about trading psychology challenges

`;
    } else if (mode === 'darkally') {
      contextPrompt += `DARKALLY MODE CONTEXT:
- User is experiencing uncertainty about future scope
- This triggers Truth-Seeker mode activation to challenge vague narratives
- Focus: Expose hidden motivations, break circular thinking, push for clarity
- Strategy: Direct questioning, pattern analysis, strategic confrontation

`;
    }
    
    contextPrompt += `User Question: ${userMessage}

Respond as DarkAlly - use the psychological data to challenge assumptions and push for growth. Keep responses concise (2-3 sentences max).`;
    
    return contextPrompt;
  }

  static async generateMoodInsight(moodData: any[], mode: 'general' | 'trading' = 'general'): Promise<string> {
    try {
      const moodSummary = this.analyzeMoodData(moodData);
      
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

Keep your response supportive, actionable, and focused on emotional wellness.`;

      const messages: ChatMessage[] = [
        { role: 'system', content: this.systemPrompts[mode] },
        { role: 'user', content: prompt }
      ];

      const options = {
        maxTokens: 400,
        temperature: 0.6
      };

      // First try to get available models dynamically
      const availableModels = await this.getAvailableModels();
      const modelsToTry = availableModels.length > 0 ? availableModels : this.FALLBACK_MODELS;
      
      let lastError;
      
      // Try each model in order until one works
      for (const model of modelsToTry) {
        try {
          console.log(`Trying model: ${model}`);
          const completion = await this.tryModel(model, messages, options);
          
          if (completion.choices[0]?.message?.content) {
            return completion.choices[0].message.content.trim();
          }
        } catch (error) {
          lastError = error;
          continue;
        }
      }

      // If we get here, all models failed
      throw lastError || new Error('All available models failed');
    } catch (error) {
      console.error('Groq Mood Insight Error:', error);
      throw new Error('Failed to generate mood insights');
    }
  }

  static async generateStressManagementTips(
    stressLevel: number, 
    triggers: string[] = [], 
    mode: 'general' | 'trading' = 'general'
  ): Promise<string> {
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

As their mood coach, provide specific, practical stress management techniques:
1. Immediate coping strategies
2. Long-term stress reduction techniques  
3. Ways to manage their specific triggers
4. Encouragement and validation

Keep it supportive and actionable.`;

      const messages: ChatMessage[] = [
        { role: 'system', content: this.systemPrompts[mode] },
        { role: 'user', content: prompt }
      ];

      const options = {
        maxTokens: 400,
        temperature: 0.7
      };

      // First try to get available models dynamically
      const availableModels = await this.getAvailableModels();
      const modelsToTry = availableModels.length > 0 ? availableModels : this.FALLBACK_MODELS;
      
      let lastError;
      
      // Try each model in order until one works
      for (const model of modelsToTry) {
        try {
          console.log(`Trying model: ${model}`);
          const completion = await this.tryModel(model, messages, options);
          
          if (completion.choices[0]?.message?.content) {
            return completion.choices[0].message.content.trim();
          }
        } catch (error) {
          lastError = error;
          continue;
        }
      }

      // If we get here, all models failed
      throw lastError || new Error('All available models failed');
    } catch (error) {
      console.error('Groq Stress Tips Error:', error);
      throw new Error('Failed to generate stress management tips');
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const testMessage = { role: 'user', content: 'Hello' };
      
      // First try to get available models dynamically
      const availableModels = await this.getAvailableModels();
      const modelsToTry = availableModels.length > 0 ? availableModels : this.FALLBACK_MODELS;
      
      for (const model of modelsToTry) {
        try {
          console.log(`Testing model: ${model}`);
          const completion = await this.tryModel(model, [testMessage], { maxTokens: 10, temperature: 0.7});
          
          if (completion.choices[0]?.message?.content) {
            return true;
          }
        } catch (error) {
          console.warn(`Model ${model} test failed:`, error);
          continue;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Groq Connection Test Failed:', error);
      return false;
    }
  }

  private static analyzeMoodData(moodData: any[]): string {
    if (!moodData.length) return "No mood data available for analysis.";

    const recent = moodData.slice(0, 7); // Last 7 entries
    const avgMood = recent.reduce((sum, entry) => sum + entry.mood_score, 0) / recent.length;
    const avgStress = recent.reduce((sum, entry) => sum + entry.stress_level, 0) / recent.length;
    const avgEnergy = recent.reduce((sum, entry) => sum + (entry.energy_level || 5), 0) / recent.length;
    const avgConfidence = recent.reduce((sum, entry) => sum + (entry.trading_confidence || entry.confidence || 5), 0) / recent.length;

    return `Recent mood analysis (last ${recent.length} entries):
- Average mood score: ${avgMood.toFixed(1)}/10
- Average stress level: ${avgStress.toFixed(1)}/10  
- Average energy level: ${avgEnergy.toFixed(1)}/10
- Average confidence: ${avgConfidence.toFixed(1)}/10

Recent entries: ${recent.map(entry => 
  `${entry.created_date?.split('T')[0]}: Mood ${entry.mood_score}, Stress ${entry.stress_level}, Energy ${entry.energy_level || 'N/A'}`
).join('; ')}`;
  }
}