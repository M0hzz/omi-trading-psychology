// src/lib/proactive-omi-service.ts
import { MoodEntryService } from '@/entities/MoodEntry';

export interface ProactiveNotification {
  id: string;
  type: 'check-in' | 'insight' | 'encouragement' | 'alert' | 'celebration';
  title: string;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  timestamp: Date;
  responses?: string[];
  autoClose?: number;
  triggerData?: any;
}

export interface UserContext {
  lastMoodEntry?: Date;
  lastStressLevel?: number;
  recentMoodTrend?: 'improving' | 'stable' | 'declining';
  currentStreak?: number;
  recentPatterns?: string[];
  daysSinceLastEntry?: number;
}

export class ProactiveOMIService {
  private static instance: ProactiveOMIService;
  private notifications: ProactiveNotification[] = [];
  private listeners: ((notification: ProactiveNotification) => void)[] = [];
  private isActive = true;
  private checkInterval: NodeJS.Timeout | null = null;

  static getInstance(): ProactiveOMIService {
    if (!this.instance) {
      this.instance = new ProactiveOMIService();
    }
    return this.instance;
  }

  startMonitoring(): void {
    if (this.checkInterval) return;
    
    console.log('OMI Proactive System: Started monitoring');
    
    this.checkInterval = setInterval(async () => {
      if (!this.isActive) return;
      
      try {
        const context = await this.getUserContext();
        await this.checkForProactiveOpportunities(context);
      } catch (error) {
        console.error('Proactive monitoring error:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    this.scheduleDailyCheckIns();
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('OMI Proactive System: Stopped monitoring');
    }
  }

  private async getUserContext(): Promise<UserContext> {
    try {
      const recentMoods = await MoodEntryService.list('-created_date', 10);
      const context: UserContext = {};
      
      if (recentMoods.length > 0) {
        const lastEntry = recentMoods[0];
        context.lastMoodEntry = new Date(lastEntry.created_date || Date.now());
        context.lastStressLevel = lastEntry.stress_level;
        
        const daysSince = Math.floor((Date.now() - context.lastMoodEntry.getTime()) / (1000 * 60 * 60 * 24));
        context.daysSinceLastEntry = daysSince;
        context.currentStreak = this.calculateStreak(recentMoods);
        context.recentMoodTrend = this.calculateMoodTrend(recentMoods);
      }
      
      return context;
    } catch (error) {
      console.error('Error getting user context:', error);
      return {};
    }
  }

  private async checkForProactiveOpportunities(context: UserContext): Promise<void> {
    if (context.daysSinceLastEntry && context.daysSinceLastEntry >= 2) {
      this.addNotification({
        type: 'check-in',
        title: 'I miss hearing from you! 💙',
        message: `It's been ${context.daysSinceLastEntry} days since your last mood check-in. How have you been feeling?`,
        urgency: 'medium',
        responses: ['Log mood now', 'I\'ve been good', 'Having a tough time'],
        autoClose: 45000
      });
      return;
    }

    if (context.lastStressLevel && context.lastStressLevel >= 8) {
      this.addNotification({
        type: 'alert',
        title: 'High stress detected 🚨',
        message: 'I saw your stress level was really high recently. Want to talk about it or try some relaxation techniques?',
        urgency: 'high',
        responses: ['Help me relax', 'Let\'s talk', 'I\'m managing it'],
        autoClose: 60000
      });
      return;
    }

    if (context.recentMoodTrend === 'improving') {
      this.addNotification({
        type: 'celebration',
        title: 'You\'re on an upward trend! 📈',
        message: 'Your mood has been consistently improving lately. That\'s awesome! What\'s been helping you feel better?',
        urgency: 'low',
        responses: ['Thanks for noticing!', 'I\'m working on myself', 'Share tips with others'],
        autoClose: 20000
      });
      return;
    }

    if (context.currentStreak && context.currentStreak >= 7 && context.currentStreak % 7 === 0) {
      this.addNotification({
        type: 'celebration',
        title: `🎉 ${context.currentStreak} day streak!`,
        message: `Amazing consistency! You've been tracking your mood for ${context.currentStreak} days straight. Your self-awareness is growing stronger!`,
        urgency: 'medium',
        responses: ['So proud!', 'Keep me motivated!', 'What\'s next?'],
        autoClose: 25000
      });
    }
  }

  private scheduleDailyCheckIns(): void {
    const scheduleTime = (hour: number, minute: number, notification: Omit<ProactiveNotification, 'id' | 'timestamp'>) => {
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, minute, 0, 0);
      
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const timeUntil = scheduledTime.getTime() - now.getTime();
      
      setTimeout(() => {
        this.addNotification(notification);
      }, timeUntil);
    };

    const lastScheduled = localStorage.getItem('omi_last_scheduled');
    const today = new Date().toDateString();
    
    if (lastScheduled !== today) {
      scheduleTime(9, 0, {
        type: 'check-in',
        title: 'Good morning! ☀️',
        message: 'A new day, a fresh start! How are you feeling this morning?',
        urgency: 'medium',
        responses: ['Feeling great!', 'A bit groggy', 'Anxious about today'],
        autoClose: 30000
      });

      scheduleTime(14, 0, {
        type: 'check-in',
        title: 'Afternoon energy check! ⚡',
        message: 'How\'s your energy? This is when most people feel a natural dip.',
        urgency: 'low',
        responses: ['Still going strong', 'Getting tired', 'Need a boost'],
        autoClose: 25000
      });

      localStorage.setItem('omi_last_scheduled', today);
    }
  }

  addNotification(notification: Omit<ProactiveNotification, 'id' | 'timestamp'>): void {
    if (!this.isActive) return;
    
    const newNotification: ProactiveNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    
    this.notifications.unshift(newNotification);
    this.notifications = this.notifications.slice(0, 10);
    
    this.listeners.forEach(listener => listener(newNotification));
    console.log('OMI Proactive: Added notification', newNotification.title);
  }

  subscribe(callback: (notification: ProactiveNotification) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  async handleResponse(notificationId: string, response: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (!notification) return;
    
    console.log('User responded:', response);
    
    const followUps: Record<string, any> = {
      'Log mood now': {
        type: 'encouragement',
        title: 'Perfect! 🎯',
        message: 'Head to the mood tracking page to log how you\'re feeling. Every entry helps build your self-awareness!',
        urgency: 'low',
        autoClose: 15000
      },
      'Thanks for noticing!': {
        type: 'encouragement',
        title: 'You\'re welcome! 🌟',
        message: 'I\'m always here to celebrate your progress. Keep up the amazing work!',
        urgency: 'low',
        autoClose: 15000
      },
      'Help me relax': {
        type: 'insight',
        title: 'Let\'s breathe together 🧘',
        message: 'Try this: breathe in for 4 counts, hold for 7, exhale for 8. Repeat 4 times. You\'ve got this!',
        urgency: 'medium',
        autoClose: 30000
      }
    };
    
    if (followUps[response]) {
      setTimeout(() => {
        this.addNotification(followUps[response]);
      }, 2000);
    }
    
    this.removeNotification(notificationId);
  }

  removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  getNotifications(): ProactiveNotification[] {
    return this.notifications;
  }

  private calculateStreak(moodEntries: any[]): number {
    if (moodEntries.length === 0) return 0;
    
    let streak = 1;
    const currentDate = new Date(moodEntries[0].created_date);
    
    for (let i = 1; i < moodEntries.length; i++) {
      const entryDate = new Date(moodEntries[i].created_date);
      const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private calculateMoodTrend(moodEntries: any[]): 'improving' | 'stable' | 'declining' {
    if (moodEntries.length < 3) return 'stable';
    
    const recent = moodEntries.slice(0, 3);
    const older = moodEntries.slice(3, 6);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, entry) => sum + entry.mood_score, 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry.mood_score, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.5) return 'improving';
    if (recentAvg < olderAvg - 0.5) return 'declining';
    return 'stable';
  }

  setActive(active: boolean): void {
    this.isActive = active;
    if (active) {
      this.startMonitoring();
    } else {
      this.stopMonitoring();
    }
  }

  isMonitoringActive(): boolean {
    return this.isActive;
  }
}