// src/components/mood-tracking/MoodForm.tsx
"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const formFields = [
  { name: "mood_score", label: "Mood", description: "How would you rate your overall mood?" },
  { name: "energy_level", label: "Energy", description: "How energetic do you feel?" },
  { name: "stress_level", label: "Stress", description: "How stressed are you feeling?" },
  { name: "confidence", label: "Confidence", description: "How confident do you feel about trading decisions?" }
];

interface MoodEntry {
  id?: string;
  mood_score: number;
  energy_level: number;
  stress_level: number;
  confidence: number;
  market_sentiment: string;
  notes: string;
  tags: string[];
  created_date?: string;
  updated_date?: string;
}

interface MoodFormProps {
  entry?: MoodEntry;
  onSubmit: (data: Omit<MoodEntry, 'id' | 'created_date' | 'updated_date'>) => void;
  onCancel: () => void;
}

export default function MoodForm({ entry, onSubmit, onCancel }: MoodFormProps) {
  const [formData, setFormData] = useState<Omit<MoodEntry, 'id' | 'created_date' | 'updated_date'>>({
    mood_score: 5,
    energy_level: 5,
    stress_level: 5,
    confidence: 5,
    market_sentiment: "NEUTRAL",
    notes: "",
    tags: []
  });
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submissions

  useEffect(() => {
    if (entry) {
      setFormData({
        mood_score: entry.mood_score,
        energy_level: entry.energy_level,
        stress_level: entry.stress_level,
        confidence: entry.confidence,
        market_sentiment: entry.market_sentiment,
        notes: entry.notes || "",
        tags: entry.tags || []
      });
    } else {
      setFormData({
        mood_score: 5, 
        energy_level: 5, 
        stress_level: 5,
        confidence: 5, 
        market_sentiment: "NEUTRAL",
        notes: "", 
        tags: []
      });
    }
  }, [entry]);

  const handleSliderChange = (name: string, value: number[]) => {
    setFormData(prev => ({ ...prev, [name]: value[0] }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, market_sentiment: value }));
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submissions
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (score: number, isStress: boolean = false) => {
    if (isStress) {
      // For stress, lower is better
      if (score <= 3) return "text-green-400";
      if (score <= 6) return "text-yellow-400";
      return "text-red-400";
    } else {
      // For others, higher is better
      if (score >= 8) return "text-green-400";
      if (score >= 5) return "text-yellow-400";
      return "text-red-400";
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm mb-8">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          {entry ? "Edit Mood Entry" : "New Mood Entry"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Sliders for each metric */}
          {formFields.map((field) => (
            <div key={field.name} className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-200">
                  {field.label}
                </label>
                <span className={`text-lg font-bold ${getScoreColor(formData[field.name as keyof typeof formData] as number, field.name === 'stress_level')}`}>
                  {formData[field.name as keyof typeof formData]}/10
                </span>
              </div>
              <Slider
                value={[formData[field.name as keyof typeof formData] as number]}
                onValueChange={(value) => handleSliderChange(field.name, value)}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-slate-400">{field.description}</p>
            </div>
          ))}

          {/* Market Sentiment */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-200">Market Sentiment</label>
            <Select value={formData.market_sentiment} onValueChange={handleSelectChange}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="BULLISH">Bullish</SelectItem>
                <SelectItem value="BEARISH">Bearish</SelectItem>
                <SelectItem value="NEUTRAL">Neutral</SelectItem>
                <SelectItem value="UNCERTAIN">Uncertain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-200">Tags</label>
            <Input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInput}
              placeholder="Add tags (press Enter or comma to add)"
              className="bg-slate-800 border-slate-600 text-white"
            />
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-slate-700 text-slate-200 pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-200">Notes</label>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Optional notes about your current state..."
              className="bg-slate-800 border-slate-600 text-white h-24"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : (entry ? "Update Entry" : "Save Entry")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}