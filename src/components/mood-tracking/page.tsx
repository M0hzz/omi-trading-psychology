// src/pages/mood-tracking.tsx (or wherever your MoodTrackingPage is)
import React, { useState, useEffect } from "react";
import { MoodEntryService, type MoodEntry } from "@/entities/MoodEntry";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, PlusCircle, Edit, Trash2, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MoodForm from "@/components/mood-tracking/MoodForm";

export default function MoodTrackingPage() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MoodEntry | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(5); // Number of entries per page

  useEffect(() => {
    loadMoodEntries();
  }, [currentPage]);

  const loadMoodEntries = async () => {
    setIsLoading(true);
    try {
      const entries = await MoodEntryService.list("-created_date", entriesPerPage, (currentPage - 1) * entriesPerPage);
      setMoodEntries(entries);
    } catch (error) {
      console.error("Error loading mood entries:", error);
    }
    setIsLoading(false);
  };

  const handleFormSubmit = async (data: Omit<MoodEntry, 'id' | 'created_date' | 'updated_date'>) => {
    try {
      if (editingEntry) {
        await MoodEntryService.update(editingEntry.id!, data);
      } else {
        await MoodEntryService.create(data);
      }
      
      await loadMoodEntries();
      setEditingEntry(null);
      setShowForm(false);
      setShowSuccess(true);
      
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving mood entry:", error);
    }
  };

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
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            {showForm ? "Cancel" : "New Entry"}
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <MoodForm
                entry={editingEntry}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Recent Entries</h2>
          
          {isLoading ? (
            <div className="grid gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-slate-900/50 border-slate-700/50">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-slate-800 rounded w-1/4"></div>
                      <div className="h-8 bg-slate-800 rounded"></div>
                      <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : moodEntries.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="p-12 text-center">
                <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No mood entries yet</h3>
                <p className="text-slate-400 mb-6">Start tracking your psychological state to gain insights into your trading performance.</p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Create First Entry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6">
                {moodEntries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-slate-400">
                              {entry.created_date && formatDate(entry.created_date)}
                            </div>
                            <Badge className={getSentimentColor(entry.market_sentiment)}>
                              {entry.market_sentiment}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
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
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-sm text-slate-400">Mood</div>
                            <div className={`text-2xl font-bold ${getScoreColor(entry.mood_score)}`}>
                              {entry.mood_score}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-slate-400">Energy</div>
                            <div className={`text-2xl font-bold ${getScoreColor(entry.energy_level)}`}>
                              {entry.energy_level}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-slate-400">Stress</div>
                            <div className={`text-2xl font-bold ${getScoreColor(10 - entry.stress_level)}`}>
                              {entry.stress_level}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-slate-400">Confidence</div>
                            <div className={`text-2xl font-bold ${getScoreColor(entry.confidence)}`}>
                              {entry.confidence}
                            </div>
                          </div>
                        </div>
                        
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {entry.tags.map((tag) => (
                              <Badge
                                key={tag}
                                className="bg-slate-800 text-slate-300 border-slate-600"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {entry.notes && (
                          <div className="text-slate-300 text-sm bg-slate-800/50 p-3 rounded">
                            {entry.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              
              {/* Pagination */}
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-slate-300">
                  Page {currentPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}