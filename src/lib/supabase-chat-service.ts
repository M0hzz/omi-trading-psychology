// src/lib/supabase-chat-service.ts
import { createSupabaseClient } from '@/lib/supabase/client';
import { ChatMessage, ChatSession } from './ai-coach-service';

const supabase = createSupabaseClient();

export interface SupabaseChatMessage {
  id: string;
  session_id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface SupabaseChatSession {
  id: string;
  user_id: string;
  mode: 'general' | 'trading';
  created_at: string;
  updated_at: string;
}

export class SupabaseChatService {
  private static tableName = 'ai_chat_sessions';
  private static messagesTable = 'ai_chat_messages';

  // Check if tables exist
  private static async checkTablesExist(): Promise<boolean> {
    try {
      // Try to query the sessions table
      const { error } = await supabase
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .limit(1);
        
      if (error) {
        console.error('Sessions table does not exist:', error);
        return false;
      }
      
      // Try to query the messages table
      const { error: messagesError } = await supabase
        .from(this.messagesTable)
        .select('id', { count: 'exact', head: true })
        .limit(1);
        
      if (messagesError) {
        console.error('Messages table does not exist:', messagesError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking tables:', error);
      return false;
    }
  }

  // Get or create a session for the current user
  static async getOrCreateSession(): Promise<ChatSession> {
    try {
      // Check if tables exist
      const tablesExist = await this.checkTablesExist();
      
      if (!tablesExist) {
        console.log('Supabase tables not found, using localStorage');
        return this.getOrCreateSessionLocal();
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        throw new Error('User not authenticated');
      }

      console.log('User authenticated:', user.id);

      // Check if session exists for today
      const today = new Date().toISOString().split('T')[0];
      console.log('Looking for session for today:', today);
      
      const { data: existingSession, error: sessionError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00Z`)
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        console.error('Error checking existing session:', sessionError);
        throw sessionError;
      }

      if (existingSession && !sessionError) {
        console.log('Found existing session:', existingSession.id);
        
        // Load messages for this session
        const { data: messages, error: messagesError } = await supabase
          .from(this.messagesTable)
          .select('*')
          .eq('session_id', existingSession.id)
          .order('timestamp');
          
        if (messagesError) {
          console.error('Error loading messages:', messagesError);
          throw messagesError;
        }
        
        return {
          id: existingSession.id,
          messages: messages || [],
          created_date: existingSession.created_at,
          mode: existingSession.mode
        };
      }

      console.log('No existing session found, creating new one');

      // Create new session
      const newSession: SupabaseChatSession = {
        id: crypto.randomUUID(),
        user_id: user.id,
        mode: 'general',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: session, error: insertError } = await supabase
        .from(this.tableName)
        .insert([newSession])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating session:', insertError);
        throw insertError;
      }

      console.log('Created new session:', session.id);

      // Add welcome message
      const welcomeMessage = this.getWelcomeMessage(newSession.mode);
      
      const { data: message, error: messageError } = await supabase
        .from(this.messagesTable)
        .insert([{
          id: crypto.randomUUID(),
          session_id: session.id,
          ...welcomeMessage
        }])
        .select()
        .single();

      if (messageError) {
        console.error('Error adding welcome message:', messageError);
        throw messageError;
      }

      console.log('Added welcome message:', message.id);

      return {
        id: session.id,
        messages: [message],
        created_date: session.created_at,
        mode: session.mode
      };
    } catch (error) {
      console.error('Error getting/creating session:', error);
      // Fallback to localStorage if Supabase fails
      return this.getOrCreateSessionLocal();
    }
  }

  // Add a message to the current session
  static async addMessage(
    message: Omit<ChatMessage, 'id' | 'timestamp'>, 
    mode: 'general' | 'trading' = 'general'
  ): Promise<ChatMessage> {
    try {
      // Check if tables exist
      const tablesExist = await this.checkTablesExist();
      
      if (!tablesExist) {
        console.log('Supabase tables not found, using localStorage');
        return this.addMessageLocal(message, mode);
      }

      const session = await this.getOrCreateSession();
      
      // Update mode if different
      if (session.mode !== mode) {
        console.log('Updating mode from', session.mode, 'to', mode);
        
        const { error } = await supabase
          .from(this.tableName)
          .update({ 
            mode: mode,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.id);

        if (error) {
          console.error('Error updating mode:', error);
          throw error;
        }
      }
      
      const newMessage: ChatMessage = {
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      };

      console.log('Adding message:', newMessage.id, 'to session:', session.id);

      // Save to Supabase
      const { data, error } = await supabase
        .from(this.messagesTable)
        .insert([{
          id: newMessage.id,
          session_id: session.id,
          type: newMessage.type,
          content: newMessage.content,
          timestamp: newMessage.timestamp
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        throw error;
      }

      console.log('Message saved successfully');

      return {
        ...newMessage,
        timestamp: data.timestamp
      };
    } catch (error) {
      console.error('Error adding message:', error);
      // Fallback to localStorage if Supabase fails
      return this.addMessageLocal(message, mode);
    }
  }

  // Update session mode
  static async updateMode(mode: 'general' | 'trading'): Promise<void> {
    try {
      // Check if tables exist
      const tablesExist = await this.checkTablesExist();
      
      if (!tablesExist) {
        console.log('Supabase tables not found, using localStorage');
        this.updateModeLocal(mode);
        return;
      }

      const session = await this.getOrCreateSession();
      
      console.log('Updating session mode from', session.mode, 'to', mode);
      
      // Update mode in Supabase
      const { error } = await supabase
        .from(this.tableName)
        .update({ 
          mode: mode,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) {
        console.error('Error updating mode:', error);
        throw error;
      }

      console.log('Mode updated successfully');

      // Reset messages to only the welcome message for the new mode
      await this.clearMessages(session.id);
      
      const welcomeMessage = this.getWelcomeMessage(mode);
      await this.addMessage({
        type: 'ai',
        content: welcomeMessage.content
      }, mode);
    } catch (error) {
      console.error('Error updating mode:', error);
      // Fallback to localStorage
      this.updateModeLocal(mode);
    }
  }

  // Clear messages for a session
  private static async clearMessages(sessionId: string): Promise<void> {
    try {
      console.log('Clearing messages for session:', sessionId);
      
      await supabase
        .from(this.messagesTable)
        .delete()
        .eq('session_id', sessionId);
      
      console.log('Messages cleared successfully');
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  }

  // Fallback to localStorage methods
  private static getOrCreateSessionLocal(): ChatSession {
    console.log('Using localStorage fallback');
    
    const stored = localStorage.getItem('ai-coach-session');
    
    if (stored) {
      console.log('Loaded session from localStorage');
      return JSON.parse(stored);
    }
    
    console.log('Creating new session in localStorage');
    
    const session: ChatSession = {
      id: Date.now().toString(),
      messages: [this.getWelcomeMessage('general')],
      created_date: new Date().toISOString(),
      mode: 'general'
    };
    
    localStorage.setItem('ai-coach-session', JSON.stringify(session));
    return session;
  }

  private static addMessageLocal(message: Omit<ChatMessage, 'id' | 'timestamp'>, mode: 'general' | 'trading' = 'general'): ChatMessage {
    console.log('Adding message to localStorage');
    
    const session = this.getOrCreateSessionLocal();
    
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    session.messages.push(newMessage);
    localStorage.setItem('ai-coach-session', JSON.stringify(session));
    
    return newMessage;
  }

  private static updateModeLocal(mode: 'general' | 'trading'): void {
    console.log('Updating mode in localStorage to:', mode);
    
    const session = this.getOrCreateSessionLocal();
    session.mode = mode;
    session.messages = [this.getWelcomeMessage(mode)];
    localStorage.setItem('ai-coach-session', JSON.stringify(session));
  }

  private static getWelcomeMessage(mode: 'general' | 'trading' = 'general'): ChatMessage {
    const content = mode === 'trading'
      ? "Hi! I'm your AI Trading Psychology Coach. I'm here to help you understand your psychological patterns, manage trading stress, and optimize your mental performance.\n\nI have access to your mood history, current market sentiment, and behavioral patterns. What would you like to discuss today?"
      : "Hey there! 👋 I'm your AI assistant, powered by DeepSeek. I can help with pretty much anything - trading, mood stuff, general knowledge, or just casual chat.\n\nWhat's on your mind today? Feel free to ask me anything!";
    
    return {
      id: 'welcome',
      type: 'ai',
      content,
      timestamp: new Date().toISOString()
    };
  }
}