// src/app/mood-tracking/page.tsx
"use client"

import React, { useState, useEffect, useCallback } from "react";
import { MoodEntryService, type MoodEntry } from "@/entities/MoodEntry";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, PlusCircle, Edit, Trash2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthGuard from '@/components/auth/AuthGuard';
import MoodForm from '@/components/mood-tracking/MoodForm';

function MoodTrackingPage() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MoodEntry | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMoodEntries();
  }, []);

  const loadMoodEntries = async () => {
    setIsLoading(true);
    try {
      const entries = await MoodEntryService.list("-created_date");
      setMoodEntries(entries);
    } catch (error) {
      console.error("Error loading mood entries:", error);
    }
    setIsLoading(false);
  };

  const handleFormSubmit = useCallback(async (data: Omit<MoodEntry, 'id' | 'created_date' | 'updated_date'>) => {
    // Prevent double submissions
    if (isSubmitting) {
      console.log("Already submitting, ignoring duplicate request");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Submitting mood entry:", data);
      
      if (editingEntry) {
        await MoodEntryService.update(editingEntry.id!, data);
      } else {
        await MoodEntryService.create(data);
      }
      
      await loadMoodEntries();
      setEditingEntry(null);
      setShowForm(false);
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving mood entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingEntry, isSubmitting]);

  const handleEdit = (entry: MoodEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        await MoodEntryService.delete(id);
        await loadMoodEntries();
      } catch (error) {
        console.error("Error deleting entry:", error);
      }
    }
  };

  const handleCancel = () => {
    setEditingEntry(null);
    setShowForm(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 5) return "text-yellow-400";
    return "text-red-400";
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "BULLISH": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "BEARISH": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "UNCERTAIN": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default: return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Success Message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-4 right-4 z-50"
            >
              <Card className="bg-green-900/20 border-green-500/30">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">Mood entry saved successfully!</span>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Mood Tracking</h1>
              <p className="text-slate-400">Log and analyze your psychological state over time</p>
            </div>
          </div>
          <Button 
            onClick={() => {
              setEditingEntry(null);
              setShowForm(!showForm);
            }}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            {showForm ? "Close Form" : "Log New Entry"}
          </Button>
        </div>

        {/* Mood Form */}
        {showForm && (
          <div className="mb-8">
            <MoodForm
              entry={editingEntry || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Mood History */}
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Mood Entry History ({moodEntries.length} entries)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center text-slate-400 py-8">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-50 animate-pulse" />
                <p>Loading mood entries...</p>
              </div>
            ) : moodEntries.length === 0 ? (
              <div className="text-center text-slate-400 py-10">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-white mb-2">No mood entries found</h3>
                <p>Use the "Log New Entry" button to get started tracking your psychology.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-slate-300 py-3 px-2">Date & Time</th>
                      <th className="text-center text-slate-300 py-3 px-2">Mood</th>
                      <th className="text-center text-slate-300 py-3 px-2">Energy</th>
                      <th className="text-center text-slate-300 py-3 px-2">Stress</th>
                      <th className="text-center text-slate-300 py-3 px-2">Confidence</th>
                      <th className="text-left text-slate-300 py-3 px-2">Market</th>
                      <th className="text-left text-slate-300 py-3 px-2">Tags</th>
                      <th className="text-right text-slate-300 py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moodEntries.map(entry => (
                      <tr key={entry.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                        <td className="text-slate-300 py-3 px-2">
                          <div>
                            <div className="font-medium">{new Date(entry.created_date!).toLocaleDateString()}</div>
                            <div className="text-xs text-slate-500">{new Date(entry.created_date!).toLocaleTimeString()}</div>
                          </div>
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className={`font-bold ${getScoreColor(entry.mood_score)}`}>
                            {entry.mood_score}
                          </span>
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className={`font-bold ${getScoreColor(entry.energy_level)}`}>
                            {entry.energy_level}
                          </span>
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className={`font-bold ${getScoreColor(10 - entry.stress_level + 1)}`}>
                            {entry.stress_level}
                          </span>
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className={`font-bold ${getScoreColor(entry.confidence)}`}>
                            {entry.confidence}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <Badge className={getSentimentColor(entry.market_sentiment)}>
                            {entry.market_sentiment}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-wrap gap-1">
                            {entry.tags?.slice(0, 2).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {entry.tags && entry.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{entry.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-3 px-2">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(entry)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(entry.id!)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <MoodTrackingPage />
    </AuthGuard>
  );
}