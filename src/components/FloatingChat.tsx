'use client'

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Bot, User, Minimize, Maximize, X, Brain, TrendingUp, Loader2 } from 'lucide-react';
import { AICoachService } from '@/lib/ai-coach-service';
import { MoodEntryService } from '@/entities/MoodEntry'; // Fixed import path

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface FloatingChatProps {
  mode?: 'general' | 'trading';
  contextData?: any;
}

export default function FloatingChat({ mode = 'trading', contextData }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);
  const [unreadCount, setUnreadCount] = useState(0);
  const [position, setPosition] = useState({ bottom: 24, right: 24 });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat session
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const session = await AICoachService.getOrCreateSession();
        setMessages(session.messages || []);
        setCurrentMode(session.mode || currentMode);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        // Fallback welcome message
        setMessages([{
          id: 'welcome',
          type: 'ai',
          content: currentMode === 'trading' 
            ? 'Hi! I\'m your OMI AI Trading Psychology Coach. How can I help with your mental performance today?'
            : 'Hey! I\'m your OMI AI assistant. How are you feeling?',
          timestamp: new Date().toISOString()
        }]);
      }
    };

    initializeChat();
  }, [currentMode]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle unread count
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.type === 'ai' && lastMessage.id !== 'welcome') {
        setUnreadCount(prev => prev + 1);
      }
    } else {
      setUnreadCount(0);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    
    // Save user message to service
    try {
      await AICoachService.addMessage(userMessage, currentMode);
    } catch (error) {
      console.error('Error saving user message:', error);
    }
    
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get AI response
      const aiResponseContent = await AICoachService.generateAIResponse(
        userMessage.content, 
        currentMode
      );
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponseContent,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Save AI response to service
      await AICoachService.addMessage(aiMessage, currentMode);
      
    } catch (error) {
      console.error('AI Response Error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm having trouble connecting right now, but I'm still here for you! What's on your mind?",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMode = async () => {
    const newMode = currentMode === 'trading' ? 'general' : 'trading';
    setCurrentMode(newMode);
    
    // Update mode in service
    try {
      await AICoachService.updateMode(newMode);
    } catch (error) {
      console.error('Error updating mode:', error);
    }
    
    // Add mode switch message
    const switchMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: newMode === 'trading' 
        ? "🔄 Switched to Trading Psychology mode! I'm now focused on market emotions, trading behavior, and performance optimization."
        : "🔄 Switched to General mode! I'm here for mood support, wellness tips, and general life advice.",
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, switchMessage]);
    try {
      await AICoachService.addMessage(switchMessage, newMode);
    } catch (error) {
      console.error('Error saving mode switch message:', error);
    }
  };

  // Get mood insights
  const getMoodInsights = async () => {
    setIsLoading(true);
    try {
      const recentMoodData = await MoodEntryService.list('-created_date', 7);
      const insights = await AICoachService.generateMoodInsights(recentMoodData, currentMode);
      
      const insightMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `📊 **Your Recent Mood Insights:**\n\n${insights}`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, insightMessage]);
      await AICoachService.addMessage(insightMessage, currentMode);
    } catch (error) {
      console.error('Mood insights error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: "I'd love to give you mood insights, but I'm having trouble accessing your data right now. How are you feeling lately?",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Floating chat button (collapsed state)
  if (!isOpen) {
    return (
      <div 
        className="fixed z-50 group"
        style={{ bottom: position.bottom, right: position.right }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 animate-pulse"
        >
          <MessageSquare className="w-6 h-6" />
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-bounce">
              {unreadCount}
            </div>
          )}
        </button>
        
        {/* Hover tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">
            Chat with OMI AI Coach
          </div>
        </div>
      </div>
    );
  }

  // Full chat interface
  return (
    <div 
      className="fixed z-50 bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-2xl"
      style={{
        bottom: position.bottom,
        right: position.right,
        width: isMinimized ? '320px' : '400px',
        height: isMinimized ? '60px' : '500px',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">OMI AI Coach</h3>
            <p className="text-slate-400 text-xs">
              {currentMode === 'trading' ? '📊 Trading Psychology' : '🌟 General Wellness'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMode}
            className="p-2 hover:bg-slate-700/50 rounded transition-colors"
            title={`Switch to ${currentMode === 'trading' ? 'General' : 'Trading'} mode`}
          >
            {currentMode === 'trading' ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <Brain className="w-4 h-4 text-purple-400" />
            )}
          </button>
          
          <button
            onClick={getMoodInsights}
            className="p-2 hover:bg-slate-700/50 rounded transition-colors"
            title="Get mood insights"
            disabled={isLoading}
          >
            <Brain className="w-4 h-4 text-blue-400" />
          </button>
          
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-slate-700/50 rounded transition-colors"
          >
            {isMinimized ? <Maximize className="w-4 h-4" /> : <Minimize className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-700/50 rounded transition-colors text-slate-400 hover:text-red-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: '380px' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'ai' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[280px] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/80 text-slate-100 border border-slate-700/30'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>
                        {line.startsWith('**') && line.endsWith('**') ? (
                          <strong className="text-blue-300">{line.slice(2, -2)}</strong>
                        ) : (
                          line
                        )}
                      </p>
                    ))}
                  </div>
                  <p className="text-xs opacity-60 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                
                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-800/80 text-slate-100 p-3 rounded-lg border border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  currentMode === 'trading' 
                    ? "Ask about trading psychology..." 
                    : "How are you feeling today?"
                }
                className="flex-1 bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none text-sm transition-colors"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 text-white px-4 py-2 rounded-lg transition-all flex items-center justify-center min-w-[44px]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setInputMessage("How's my recent mood trend?")}
                className="text-xs bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 px-2 py-1 rounded border border-slate-600/30 transition-colors"
              >
                📊 Mood Trend
              </button>
              <button
                onClick={() => setInputMessage("I'm feeling stressed about trading")}
                className="text-xs bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 px-2 py-1 rounded border border-slate-600/30 transition-colors"
              >
                😰 Stress Help
              </button>
              <button
                onClick={() => setInputMessage("Give me a confidence boost")}
                className="text-xs bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 px-2 py-1 rounded border border-slate-600/30 transition-colors"
              >
                💪 Confidence
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}