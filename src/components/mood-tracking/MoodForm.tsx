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
  { name: "mood_score", label: "Mood" },
  { name: "energy_level", label: "Energy" },
  { name: "stress_level", label: "Stress" },
  { name: "trading_confidence", label: "Confidence" }
];

interface MoodEntry {
  id?: string;
  mood_score: number;
  energy_level: number;
  stress_level: number;
  trading_confidence: number;
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
    trading_confidence: 5,
    market_sentiment: "NEUTRAL",
    notes: "",
    tags: []
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (entry) {
      setFormData({
        mood_score: entry.mood_score,
        energy_level: entry.energy_level,
        stress_level: entry.stress_level,
        trading_confidence: entry.trading_confidence,
        market_sentiment: entry.market_sentiment,
        notes: entry.notes,
        tags: entry.tags || []
      });
    } else {
      setFormData({
        mood_score: 5, 
        energy_level: 5, 
        stress_level: 5,
        trading_confidence: 5, 
        market_sentiment: "NEUTRAL",
        notes: "", 
        tags: []
      });
    }
  }, [entry]);

  const handleSliderChange = (name: string, value: number[]) => {
    console.log(`Slider ${name} changed to:`, value[0]); // Debug log
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form data:", formData); // Debug log
    onSubmit(formData);
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm mb-8">
      <CardHeader>
        <CardTitle className="text-white">
          {entry ? "Edit" : "New"} Mood Entry
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Slider Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {formFields.map(field => (
              <div key={field.name} className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-medium">{field.label}</label>
                  <span className="text-white font-bold text-lg bg-slate-800 px-3 py-1 rounded">
                    {formData[field.name as keyof typeof formData] as number}
                  </span>
                </div>
                <Slider
                  value={[formData[field.name as keyof typeof formData] as number]}
                  onValueChange={(value) => handleSliderChange(field.name, value)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            ))}
          </div>

          {/* Market Sentiment and Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-slate-300 font-medium">Market Sentiment</label>
              <Select value={formData.market_sentiment} onValueChange={handleSelectChange}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BULLISH">Bullish</SelectItem>
                  <SelectItem value="BEARISH">Bearish</SelectItem>
                  <SelectItem value="NEUTRAL">Neutral</SelectItem>
                  <SelectItem value="UNCERTAIN">Uncertain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-slate-300 font-medium">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(tag)} 
                      className="ml-2 hover:text-blue-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInput}
                placeholder="Add tags (e.g., focused, anxious) - Press Enter"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <label className="text-slate-300 font-medium">Notes</label>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any specific thoughts, feelings, or observations about your current state..."
              className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex gap-3">
          <Button 
            type="button"
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {entry ? "Update" : "Save"} Entry
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}