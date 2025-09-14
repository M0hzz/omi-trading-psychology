// src/components/ProactiveOMISystem.tsx
"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Brain, Heart, TrendingUp, AlertTriangle, Zap, MessageCircle, X, Volume2, VolumeX } from 'lucide-react';
import { ProactiveOMIService, type ProactiveNotification } from '@/lib/proactive-omi-service';

export default function ProactiveOMISystem() {
  const [notifications, setNotifications] = useState<ProactiveNotification[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const notificationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const proactiveService = ProactiveOMIService.getInstance();

  useEffect(() => {
    // Subscribe to notifications from the service
    const unsubscribe = proactiveService.subscribe((notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 5));
      setIsVisible(true);
      
      if (notification.autoClose) {
        const timeout = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.autoClose);
        
        notificationTimeouts.current.set(notification.id, timeout);
      }
    });

    // Start monitoring if enabled
    if (isEnabled) {
      proactiveService.startMonitoring();
    }

    // Welcome message
    if (isEnabled) {
      const welcomeTimeout = setTimeout(() => {
        proactiveService.addNotification({
          type: 'check-in',
          title: 'OMI is here! 👋',
          message: "I'm your proactive AI companion. I'll check in on you throughout the day and offer support when you need it!",
          urgency: 'medium',
          responses: ['Sounds great!', 'Thanks OMI', 'Tell me more'],
          autoClose: 20000
        });
      }, 3000);

      return () => {
        clearTimeout(welcomeTimeout);
        unsubscribe();
        proactiveService.stopMonitoring();
      };
    }
  }, [isEnabled]);

  const removeNotification = (id: string) => {
    proactiveService.removeNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    const timeout = notificationTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      notificationTimeouts.current.delete(id);
    }
  };

  const handleResponse = (notificationId: string, response: string) => {
    proactiveService.handleResponse(notificationId, response);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'check-in': return <Heart className="w-5 h-5 text-blue-400" />;
      case 'insight': return <Brain className="w-5 h-5 text-purple-400" />;
      case 'encouragement': return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'alert': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'celebration': return <TrendingUp className="w-5 h-5 text-green-400" />;
      default: return <MessageCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getNotificationColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-red-500/50 bg-red-900/20';
      case 'medium': return 'border-blue-500/50 bg-blue-900/20';
      case 'low': return 'border-slate-500/50 bg-slate-900/20';
      default: return 'border-slate-500/50 bg-slate-900/20';
    }
  };

  const addTestNotification = () => {
    const testNotifications = [
      {
        type: 'check-in' as const,
        title: 'How are you doing? 🤔',
        message: 'Just wanted to check in and see how your day is going so far!',
        urgency: 'medium' as const,
        responses: ['Doing well!', 'Been better', 'Thanks for asking'],
        autoClose: 15000
      },
      {
        type: 'celebration' as const,
        title: 'You\'re awesome! 🎉',
        message: 'Just a reminder that you\'re doing great things and making progress every day!',
        urgency: 'low' as const,
        autoClose: 12000
      },
      {
        type: 'insight' as const,
        title: 'Quick tip! 💡',
        message: 'Remember: progress isn\'t always linear. Small steps forward are still progress!',
        urgency: 'low' as const,
        autoClose: 18000
      }
    ];
    
    const randomNotification = testNotifications[Math.floor(Math.random() * testNotifications.length)];
    proactiveService.addNotification(randomNotification);
  };

  if (!isEnabled) return null;

  return (
    <>
      {/* Floating notification panel */}
      {isVisible && notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 max-w-sm space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border backdrop-blur-sm shadow-2xl ${getNotificationColor(notification.urgency)} animate-in slide-in-from-right-full duration-500`}
            >
              <div className="flex items-start gap-3">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-white">
                      {notification.title}
                    </h4>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="text-slate-400 hover:text-white transition-colors"
                      aria-label="Close notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-3">
                    {notification.message}
                  </p>
                  
                  {notification.responses && (
                    <div className="flex flex-wrap gap-2">
                      {notification.responses.map((response, index) => (
                        <button
                          key={index}
                          onClick={() => handleResponse(notification.id, response)}
                          className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full transition-colors border border-white/20"
                        >
                          {response}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-500 mt-2">
                    {notification.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Control panel */}
      <div className="fixed bottom-4 left-4 z-50">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Brain className="w-4 h-4 text-blue-400" />
            <span className="font-medium">OMI Assistant</span>
          </div>
          
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => {
                const newEnabledState = !isEnabled;
                setIsEnabled(newEnabledState);
                proactiveService.setActive(newEnabledState);
              }}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                isEnabled 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              <Bell className="w-3 h-3" />
              {isEnabled ? 'Active' : 'Paused'}
            </button>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-slate-400 hover:text-white transition-colors"
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={addTestNotification}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Test
            </button>
          </div>
        </div>
      </div>

      {/* Background task indicator */}
      {isEnabled && (
        <div className="fixed top-4 left-4 z-40">
          <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-700/50">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-400">OMI monitoring</span>
          </div>
        </div>
      )}
    </>
  );
}