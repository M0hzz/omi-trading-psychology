"use client"
import React, { useState, useRef, useEffect } from "react";
import { MoodEntryService, MarketIntelligenceService, PsychologyPatternService } from "@/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Bot, User, Loader2, Brain, TrendingUp, ToggleLeft, ToggleRight } from "lucide-react";
import { format } from "date-fns";
import AuthGuard from '@/components/auth/AuthGuard';
import { AICoachService } from '@/lib/ai-coach-service';

interface ChatMessage {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

function AICoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contextData, setContextData] = useState<any>(null);
  const [mode, setMode] = useState<'general' | 'trading'>('trading');
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Load session from service on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await AICoachService.getOrCreateSession();
        setMessages(session.messages);
        setMode(session.mode);
      } catch (error) {
        console.error("Error loading session:", error);
      }
    };
    
    loadSession();
    loadContextData();
    
    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Show online/offline status
  useEffect(() => {
    if (!isOnline) {
      // Show offline notification
      const offlineNotification = document.createElement('div');
      offlineNotification.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      offlineNotification.textContent = 'You are offline. Chat will be saved locally.';
      document.body.appendChild(offlineNotification);
      
      return () => {
        document.body.removeChild(offlineNotification);
      };
    }
  }, [isOnline]);
  
  // Load context data
  const loadContextData = async () => {
    try {
      console.log("Loading fresh context data...");
      const [moods, news, patterns] = await Promise.all([
        MoodEntryService.list("-created_date", 10),
        MarketIntelligenceService.list("-created_date", 10),
        PsychologyPatternService.list("-created_date", 5)
      ]);
      
      console.log("Fresh mood entries:", moods.length);
      setContextData({ moods, news, patterns });
    } catch (error) {
      console.error("Error loading context data:", error);
    }
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const buildContextPrompt = (userQuestion: string) => {
    if (!contextData) return userQuestion;
    const { moods, news, patterns } = contextData;
    
    // Recent mood analysis
    const recentMoodAvg = moods.length > 0 
      ? moods.reduce((sum: number, m: any) => sum + m.mood_score, 0) / moods.length 
      : 0;
    const recentStressAvg = moods.length > 0 
      ? moods.reduce((sum: number, m: any) => sum + m.stress_level, 0) / moods.length 
      : 0;
    
    // Market sentiment analysis
    const marketSentiment = news.length > 0 
      ? news.reduce((sum: number, n: any) => sum + n.sentiment_score, 0) / news.length 
      : 0;
      
    let contextPrompt;
    
    if (mode === 'trading') {
      contextPrompt = `You are an expert AI Trading Psychology Coach. Here's the current psychological and market context:
RECENT PSYCHOLOGICAL STATE (${moods.length} recent entries):
- Average Mood Score: ${recentMoodAvg.toFixed(1)}/10
- Average Stress Level: ${recentStressAvg.toFixed(1)}/10
- Recent Mood Entries: ${moods.slice(0, 3).map((m: any) => `${format(new Date(m.created_date), 'MM/dd HH:mm')}: Mood ${m.mood_score}, Stress ${m.stress_level}, Confidence ${m.confidence}`).join('; ')}
CURRENT MARKET CONDITIONS:
- Market Sentiment Score: ${marketSentiment.toFixed(2)} (from recent news analysis)
- Recent Headlines: ${news.slice(0, 3).map((n: any) => n.headline).join('; ')}
DETECTED PSYCHOLOGICAL PATTERNS:
${patterns.map((p: any) => `- ${p.pattern_type}: ${p.description} (Severity: ${p.severity}, Confidence: ${Math.round(p.confidence * 100)}%)`).join('\n')}
COACHING GUIDELINES:
1. Provide personalized trading psychology advice based on the user's psychological patterns
2. Correlate market conditions with psychological state
3. Give specific, actionable trading recommendations
4. Be supportive but realistic about trading psychology challenges
5. Help identify trading triggers and suggest coping strategies
6. Use the detected patterns to provide trading insights
User Question: ${userQuestion}
Respond as their personal trading psychology coach with specific insights based on this data.`;
    } else {
      contextPrompt = `You are a general AI assistant. Here's some context about the user:
RECENT PSYCHOLOGICAL STATE (${moods.length} recent entries):
- Average Mood Score: ${recentMoodAvg.toFixed(1)}/10
- Average Stress Level: ${recentStressAvg.toFixed(1)}/10
- Recent Mood Entries: ${moods.slice(0, 3).map((m: any) => `${format(new Date(m.created_date), 'MM/dd HH:mm')}: Mood ${m.mood_score}, Stress ${m.stress_level}, Confidence ${m.confidence}`).join('; ')}
CURRENT MARKET CONDITIONS (if relevant):
- Market Sentiment Score: ${marketSentiment.toFixed(2)} (from recent news analysis)
- Recent Headlines: ${news.slice(0, 3).map((n: any) => n.headline).join('; ')}
DETECTED PSYCHOLOGICAL PATTERNS:
${patterns.map((p: any) => `- ${p.pattern_type}: ${p.description} (Severity: ${p.severity}, Confidence: ${Math.round(p.confidence * 100)}%)`).join('\n')}
RESPONSE GUIDELINES:
1. Provide helpful, general advice based on the user's psychological patterns
2. Be supportive and empathetic
3. Give specific, actionable recommendations
4. Be conversational and friendly
5. Help identify triggers and suggest coping strategies
6. Use the detected patterns to provide insights when relevant
User Question: ${userQuestion}
Respond as a helpful AI assistant with general advice and insights.`;
    }
    
    return contextPrompt;
  };
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    // Refresh context data before sending message
    await loadContextData();
    
    // Add user message using the service
    const userMessage = await AICoachService.addMessage({
      type: 'user',
      content: inputMessage.trim()
    }, mode);
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    
    try {
      const contextualPrompt = buildContextPrompt(inputMessage.trim());
      const response = await AICoachService.generateAIResponse(inputMessage.trim(), mode);
      
      // Add AI response using the service
      const aiMessage = await AICoachService.addMessage({
        type: 'ai',
        content: response
      }, mode);
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = await AICoachService.addMessage({
        type: 'ai',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment."
      }, mode);
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setIsLoading(false);
    inputRef.current?.focus();
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const toggleMode = async () => {
    const newMode = mode === 'trading' ? 'general' : 'trading';
    
    // Update mode in service
    await AICoachService.updateMode(newMode);
    
    // Update local state
    setMode(newMode);
    
    // Reload session to get updated messages
    const session = await AICoachService.getOrCreateSession();
    setMessages(session.messages);
  };
  
  const getQuickPrompts = () => {
    if (mode === 'trading') {
      return [
        "How is my current psychological state affecting my trading?",
        "What patterns have you noticed in my mood data?",
        "How should I adjust my trading based on market sentiment?",
        "Give me stress management techniques for trading",
        "What's the best time of day for me to make trading decisions?"
      ];
    } else {
      return [
        "How is my current psychological state?",
        "What patterns have you noticed in my mood data?",
        "Give me stress management techniques",
        "How can I improve my confidence?",
        "What's something I can do to feel better today?"
      ];
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {mode === 'trading' ? 'AI Trading Psychology Coach' : 'AI Life Coach'}
              </h1>
              <p className="text-slate-400">
                {mode === 'trading' ? 'Your personal JARVIS for mental performance optimization' : 'Your AI companion for well-being and growth'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isOnline && (
              <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/20 px-2 py-1 rounded-md">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-xs">Offline</span>
              </div>
            )}
            
            <Button
              onClick={toggleMode}
              variant="outline"
              className="flex items-center gap-2 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              {mode === 'trading' ? (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  Switch to General Mode
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4" />
                  Switch to Trading Mode
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Context Status */}
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300">
                  {contextData?.moods?.length || 0} mood entries analyzed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">
                  {contextData?.news?.length || 0} market signals active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300">
                  {contextData?.patterns?.length || 0} patterns detected
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Chat Area */}
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-white">AI Coaching Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 overflow-y-auto mb-4 space-y-4 p-4 bg-slate-800/30 rounded-lg">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-blue-500' 
                        : 'bg-gradient-to-r from-purple-500 to-blue-500'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-100'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      <div className="text-xs opacity-70 mt-2">
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-700 text-slate-100 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">
                        {mode === 'trading' ? 'Analyzing your trading psychology data...' : 'Thinking about your question...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Quick Prompts */}
            <div className="mb-4">
              <h4 className="text-slate-400 text-sm mb-2">Quick prompts:</h4>
              <div className="flex flex-wrap gap-2">
                {getQuickPrompts().map((prompt, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-slate-700 text-slate-300 border-slate-600 transition-colors"
                    onClick={() => setInputMessage(prompt)}
                  >
                    {prompt}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Input Area */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={mode === 'trading' 
                  ? "Ask about your trading psychology, patterns, or get coaching advice..." 
                  : "Ask me anything - mood, relationships, goals, or just chat..."}
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <AICoachPage />
    </AuthGuard>
  );
}