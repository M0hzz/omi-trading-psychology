// src/components/mood-tracking/MoodForm.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { ProactiveOMIService } from '@/lib/proactive-omi-service';
import { MoodEntryService } from '@/entities/MoodEntry';

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

// Component for a single slider field
const MoodSlider: React.FC<{
  name: keyof MoodEntry;
  label: string;
  description: string;
  value: number;
  onChange: (name: string, value: number) => void;
  isStress?: boolean;
}> = ({ name, label, description, value, onChange, isStress }) => {
  const getScoreColor = (score: number, isStress: boolean = false) => {
    if (isStress) {
      return score <= 3 ? "text-green-400" : score <= 6 ? "text-yellow-400" : "text-red-400";
    } else {
      return score >= 8 ? "text-green-400" : score >= 5 ? "text-yellow-400" : "text-red-400";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-200">
          {label}
        </label>
        <span className={`text-lg font-bold ${getScoreColor(value, isStress)}`}>
          {value}/10
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(value) => onChange(name, value[0])}
        max={10}
        min={1}
        step={1}
        className="w-full"
      />
      <p className="text-xs text-slate-400">{description}</p>
    </div>
  );
};

// Component for tags input
const TagsInput: React.FC<{
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}> = ({ tags, onAddTag, onRemoveTag }) => {
  const [tagInput, setTagInput] = useState("");

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        onAddTag(newTag);
      }
      setTagInput("");
    }
  };

  return (
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
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="bg-slate-700 text-slate-200 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="ml-2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);

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

  const handleSliderChange = (name: string, value: number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, market_sentiment: value }));
  };

  const handleAddTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    if (formData.mood_score < 1 || formData.mood_score > 10) {
      alert('Mood score must be between 1 and 10');
      return false;
    }
    if (formData.energy_level < 1 || formData.energy_level > 10) {
      alert('Energy level must be between 1 and 10');
      return false;
    }
    if (formData.stress_level < 1 || formData.stress_level > 10) {
      alert('Stress level must be between 1 and 10');
      return false;
    }
    if (formData.confidence < 1 || formData.confidence > 10) {
      alert('Confidence must be between 1 and 10');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await MoodEntryService.create(formData);
      
      const proactiveService = ProactiveOMIService.getInstance();
      
      if (formData.stress_level >= 8) {
        setTimeout(() => {
          proactiveService.addNotification({
            type: 'alert',
            title: 'I see you\'re stressed 😟',
            message: 'High stress can be overwhelming. Want to try a quick breathing exercise or talk about what\'s causing it?',
            urgency: 'high',
            responses: ['Help me calm down', 'Let\'s talk about it', 'I\'m handling it'],
            autoClose: 60000
          });
        }, 5000);
      }
      
      if (formData.mood_score >= 8) {
        proactiveService.addNotification({
          type: 'celebration',
          title: 'You\'re feeling great! ✨',
          message: 'I love seeing you in such a positive state! What\'s contributing to this good mood?',
          urgency: 'low',
          responses: ['Life is good!', 'Good trading day', 'Working on myself'],
          autoClose: 20000
        });
      }
      
      if (formData.energy_level <= 3) {
        proactiveService.addNotification({
          type: 'check-in',
          title: 'Low energy day? 😴',
          message: 'Sometimes our bodies need rest. Are you getting enough sleep? Maybe a short walk or some fresh air could help?',
          urgency: 'medium',
          responses: ['Need rest', 'Could use tips', 'I\'ll be fine'],
          autoClose: 30000
        });
      }
      
      proactiveService.addNotification({
        type: 'encouragement',
        title: 'Thanks for checking in! 💙',
        message: 'I appreciate you taking the time to track your mood. This self-awareness is a superpower!',
        urgency: 'low',
        autoClose: 10000
      });
      
      setNotificationSent(true);
      onSubmit(formData);
    } catch (error) {
      console.error('Error submitting mood entry:', error);
      alert('There was an error saving your mood entry. Please try again.');
    } finally {
      setIsSubmitting(false);
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
          <MoodSlider
            name="mood_score"
            label="Mood"
            description="How would you rate your overall mood?"
            value={formData.mood_score}
            onChange={handleSliderChange}
          />
          <MoodSlider
            name="energy_level"
            label="Energy"
            description="How energetic do you feel?"
            value={formData.energy_level}
            onChange={handleSliderChange}
          />
          <MoodSlider
            name="stress_level"
            label="Stress"
            description="How stressed are you feeling?"
            value={formData.stress_level}
            onChange={handleSliderChange}
            isStress={true}
          />
          <MoodSlider
            name="confidence"
            label="Confidence"
            description="How confident do you feel about trading decisions?"
            value={formData.confidence}
            onChange={handleSliderChange}
          />
          
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
          
          <TagsInput
            tags={formData.tags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
          
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-200">Notes</label>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Optional notes about your current state..."
              className="bg-slate-800 border-slate-600 text-white h-24"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-green-600 hover:bg-green-700" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : (entry ? "Update Entry" : "Save Entry")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}