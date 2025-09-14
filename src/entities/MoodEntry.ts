// src/entities/MoodEntry.ts
import { supabase } from '@/lib/supabase';

export interface MoodEntry {
  id?: string;
  mood_score: number;
  energy_level: number;
  stress_level: number;
  confidence: number; // Changed from trading_confidence
  market_sentiment: "BULLISH" | "BEARISH" | "NEUTRAL" | "UNCERTAIN";
  notes?: string;
  tags?: string[];
  created_date?: string;
  updated_date?: string;
}

// Database types (these might have different column names)
interface DbMoodEntry {
  id: string;
  user_id: string;
  mood_score: number;
  energy_level: number;
  stress_level: number;
  trading_confidence: number; // Database still uses this name
  market_sentiment: string;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface CreateMoodEntry {
  user_id: string;
  mood_score: number;
  energy_level: number;
  stress_level: number;
  trading_confidence: number;
  market_sentiment: string;
  notes?: string | null;
  tags?: string[] | null;
}

interface UpdateMoodEntry {
  mood_score?: number;
  energy_level?: number;
  stress_level?: number;
  trading_confidence?: number;
  market_sentiment?: string;
  notes?: string | null;
  tags?: string[] | null;
}

// Auth helper function
const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export class MoodEntryService {
  private static storageKey = 'omi_mood_entries';

  // Transform database entry to app entry
  private static dbToApp(dbEntry: DbMoodEntry): MoodEntry {
    return {
      id: dbEntry.id,
      mood_score: dbEntry.mood_score,
      energy_level: dbEntry.energy_level,
      stress_level: dbEntry.stress_level,
      confidence: dbEntry.trading_confidence, // Map database field to app field
      market_sentiment: dbEntry.market_sentiment as any,
      notes: dbEntry.notes || "",
      tags: dbEntry.tags || [],
      created_date: dbEntry.created_at,
      updated_date: dbEntry.updated_at,
    };
  }

  // Transform app entry to database entry
  private static appToDb(appEntry: Omit<MoodEntry, 'id' | 'created_date' | 'updated_date'>, userId: string): CreateMoodEntry {
    return {
      user_id: userId,
      mood_score: appEntry.mood_score,
      energy_level: appEntry.energy_level,
      stress_level: appEntry.stress_level,
      trading_confidence: appEntry.confidence, // Map app field to database field
      market_sentiment: appEntry.market_sentiment,
      notes: appEntry.notes || null,
      tags: appEntry.tags || null,
    };
  }

  static async list(sort = "-created_date", limit?: number): Promise<MoodEntry[]> {
    const user = await getCurrentUser();
    
    // Fallback to localStorage if not authenticated
    if (!user) {
      return this.getLocalStorageEntries(sort, limit);
    }

    try {
      let query = supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id);

      // Apply sorting
      if (sort === "-created_date") {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: true });
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching mood entries:', error);
        throw error;
      }

      return (data || []).map(this.dbToApp);
    } catch (error) {
      console.error('Error in list:', error);
      // Fallback to localStorage on error
      return this.getLocalStorageEntries(sort, limit);
    }
  }

  static async create(data: Omit<MoodEntry, 'id' | 'created_date' | 'updated_date'>): Promise<MoodEntry> {
    const user = await getCurrentUser();
    
    // Fallback to localStorage if not authenticated
    if (!user) {
      return this.createLocalStorageEntry(data);
    }

    try {
      const dbData = this.appToDb(data, user.id);
      
      const { data: newEntry, error } = await supabase
        .from('mood_entries')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        console.error('Error creating mood entry:', error);
        throw error;
      }

      return this.dbToApp(newEntry);
    } catch (error) {
      console.error('Error in create:', error);
      // Fallback to localStorage on error
      return this.createLocalStorageEntry(data);
    }
  }

  static async update(id: string, data: Partial<MoodEntry>): Promise<MoodEntry> {
    const user = await getCurrentUser();
    
    // Fallback to localStorage if not authenticated
    if (!user) {
      return this.updateLocalStorageEntry(id, data);
    }

    try {
      const updateData: UpdateMoodEntry = {};
      
      if (data.mood_score !== undefined) updateData.mood_score = data.mood_score;
      if (data.energy_level !== undefined) updateData.energy_level = data.energy_level;
      if (data.stress_level !== undefined) updateData.stress_level = data.stress_level;
      if (data.market_sentiment !== undefined) updateData.market_sentiment = data.market_sentiment;
      if (data.confidence !== undefined) updateData.trading_confidence = data.confidence; // Map app field to db field
      if (data.notes !== undefined) updateData.notes = data.notes || null;
      if (data.tags !== undefined) updateData.tags = data.tags || null;

      const { data: updatedEntry, error } = await supabase
        .from('mood_entries')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating mood entry:', error);
        throw error;
      }

      return this.dbToApp(updatedEntry);
    } catch (error) {
      console.error('Error in update:', error);
      // Fallback to localStorage on error
      return this.updateLocalStorageEntry(id, data);
    }
  }

  static async delete(id: string): Promise<void> {
    const user = await getCurrentUser();
    
    // Fallback to localStorage if not authenticated
    if (!user) {
      return this.deleteLocalStorageEntry(id);
    }

    try {
      const { error } = await supabase
        .from('mood_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting mood entry:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in delete:', error);
      // Fallback to localStorage on error
      return this.deleteLocalStorageEntry(id);
    }
  }

  // Migration function to move localStorage data to Supabase
  static async migrateFromLocalStorage(): Promise<void> {
    const user = await getCurrentUser();
    if (!user) {
      console.log('Cannot migrate: user not authenticated');
      return;
    }

    const localEntries = this.getLocalStorageEntries();
    if (localEntries.length === 0) {
      console.log('No local entries to migrate');
      return;
    }

    try {
      console.log(`Migrating ${localEntries.length} entries to Supabase...`);
      
      for (const entry of localEntries) {
        const dbData = this.appToDb(entry, user.id);
        
        // Override created_at with the original date if available
        if (entry.created_date) {
          (dbData as any).created_at = entry.created_date;
        }

        const { error } = await supabase
          .from('mood_entries')
          .insert(dbData);

        if (error) {
          console.error('Error migrating entry:', error);
        }
      }

      // Clear localStorage after successful migration
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.storageKey);
      }
      
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  // Fallback methods for localStorage (keep existing functionality)
  private static getLocalStorageEntries(sort = "-created_date", limit?: number): MoodEntry[] {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(this.storageKey) : null;
    let entries: MoodEntry[] = stored ? JSON.parse(stored) : this.getMockData();
    
    if (sort === "-created_date") {
      entries.sort((a, b) => new Date(b.created_date!).getTime() - new Date(a.created_date!).getTime());
    }
    
    return limit ? entries.slice(0, limit) : entries;
  }

  private static async createLocalStorageEntry(data: Omit<MoodEntry, 'id' | 'created_date' | 'updated_date'>): Promise<MoodEntry> {
    const entries = this.getLocalStorageEntries();
    const newEntry: MoodEntry = {
      ...data,
      id: Date.now().toString(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    
    entries.unshift(newEntry);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
    }
    return newEntry;
  }

  private static async updateLocalStorageEntry(id: string, data: Partial<MoodEntry>): Promise<MoodEntry> {
    const entries = this.getLocalStorageEntries();
    const index = entries.findIndex(entry => entry.id === id);
    
    if (index === -1) {
      throw new Error('Entry not found');
    }
    
    entries[index] = {
      ...entries[index],
      ...data,
      updated_date: new Date().toISOString(),
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
    }
    return entries[index];
  }

  private static async deleteLocalStorageEntry(id: string): Promise<void> {
    const entries = this.getLocalStorageEntries();
    const filtered = entries.filter(entry => entry.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }
  }

  private static getMockData(): MoodEntry[] {
    const now = new Date();
    const mockEntries: MoodEntry[] = [];
    
    for (let i = 0; i < 15; i++) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      mockEntries.push({
        id: (1000 + i).toString(),
        mood_score: Math.floor(Math.random() * 10) + 1,
        energy_level: Math.floor(Math.random() * 10) + 1,
        stress_level: Math.floor(Math.random() * 10) + 1,
        confidence: Math.floor(Math.random() * 10) + 1, // Changed from trading_confidence
        market_sentiment: ["BULLISH", "BEARISH", "NEUTRAL", "UNCERTAIN"][Math.floor(Math.random() * 4)] as any,
        notes: `Sample entry for ${date.toDateString()}`,
        tags: Math.random() > 0.5 ? [["focused", "anxious", "confident", "stressed"][Math.floor(Math.random() * 4)]] : [],
        created_date: date.toISOString(),
        updated_date: date.toISOString(),
      });
    }
    
    return mockEntries;
  }
}