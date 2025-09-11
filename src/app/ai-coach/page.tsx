"use client"

import React, { useState, useRef, useEffect } from "react";
import { AICoachService, type ChatMessage } from "@/entities/AICoach";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Bot, User, Loader2, Brain, TrendingUp } from "lucide-react";

export default function AICoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadChatSession();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatSession = async () => {
    try {
      const session = await AICoachService.getOrCreateSession();
      setMessages(session.messages);
    } catch (error) {
      console.error("Error loading chat session:", error);
    }
    setIsInitializing(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessageContent = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    try {
      // Add user message
      const userMessage = await AICoachService.addMessage({
        type: 'user',
        content: userMessageContent
      });

      setMessages(prev => [...prev, userMessage]);

      // Generate AI response
      const aiResponse = await AICoachService.generateAIResponse(userMessageContent);
      
      const aiMessage = await AICoachService.addMessage({
        type: 'ai',
        content: aiResponse
      });

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = await AICoachService.addMessage({
        type: 'ai',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment."
      });
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

  const quickPrompts = [
    "How is my current psychological state affecting my trading?",
    "What patterns have you noticed in my mood data?",
    "How should I adjust my trading based on market sentiment?",
    "Give me stress management techniques for trading",
    "What's the best time of day for me to make trading decisions?"
  ];

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">AI Trading Psychology Coach</h1>
            <p className="text-slate-400">Your personal JARVIS for mental performance optimization</p>
          </div>
        </div>

        {/* Context Status */}
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300">
                  15 mood entries analyzed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">
                  10 market signals active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300">
                  6 patterns detected
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
              {isInitializing ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  <span className="ml-2 text-slate-400">Initializing AI Coach...</span>
                </div>
              ) : (
                messages.map((message) => (
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
                ))
              )}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-700 text-slate-100 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Analyzing your psychological data...</span>
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
                {quickPrompts.map((prompt, index) => (
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
              <input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your trading psychology, patterns, or get coaching advice..."
                className="flex-1 bg-slate-800 border border-slate-600 text-white placeholder-slate-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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