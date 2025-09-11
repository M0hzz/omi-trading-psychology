export interface MoodEntry {
  id?: string;
  mood_score: number; // 1-10
  energy_level: number; // 1-10
  stress_level: number; // 1-10
  market_sentiment: "BULLISH" | "BEARISH" | "NEUTRAL" | "UNCERTAIN";
  trading_confidence: number; // 1-10
  notes?: string;
  tags?: string[];
  created_date?: string;
  updated_date?: string;
}

// Mock data service (simulates API calls)
export class MoodEntryService {
  private static storageKey = 'omi_mood_entries';

  static async list(sort = "-created_date", limit?: number): Promise<MoodEntry[]> {
    // In a real app, this would be an API call
    const stored = typeof window !== 'undefined' ? localStorage.getItem(this.storageKey) : null;
    let entries: MoodEntry[] = stored ? JSON.parse(stored) : this.getMockData();
    
    // Sort entries
    if (sort === "-created_date") {
      entries.sort((a, b) => new Date(b.created_date!).getTime() - new Date(a.created_date!).getTime());
    }
    
    return limit ? entries.slice(0, limit) : entries;
  }

  static async create(data: Omit<MoodEntry, 'id' | 'created_date' | 'updated_date'>): Promise<MoodEntry> {
    const entries = await this.list();
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

  static async update(id: string, data: Partial<MoodEntry>): Promise<MoodEntry> {
    const entries = await this.list();
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

  static async delete(id: string): Promise<void> {
    const entries = await this.list();
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
        trading_confidence: Math.floor(Math.random() * 10) + 1,
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