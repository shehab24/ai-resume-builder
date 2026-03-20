"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../../lib/store/hooks";
import { addSkill, removeSkill } from "../../../../lib/store/resumeSlice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Sparkles, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface SkillsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function SkillsStep({ onNext, onBack }: SkillsStepProps) {
  const dispatch = useAppDispatch();
  const skills = useAppSelector((state) => state.resume.skills);
  const basicInfo = useAppSelector((state) => state.resume.basicInfo);
  const experiences = useAppSelector((state) => state.resume.experience);
  
  const [newSkill, setNewSkill] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      // Don't fetch if we don't have enough context
      if (!basicInfo.title) return;

      setIsLoadingSuggestions(true);
      try {
        const response = await fetch("/api/ai/suggest-skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: basicInfo.title,
            experiences: experiences,
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch suggestions");
        const data = await response.json();
        setSuggestions(data.skills);
      } catch (error) {
        console.error(error);
        toast.error("Could not fetch skill suggestions");
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    if (suggestions.length === 0) {
      fetchSuggestions();
    }
  }, [basicInfo.title, experiences, suggestions.length]);

  const handleAddSkill = (skillText: string) => {
    const trimmedSkill = skillText.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      dispatch(addSkill(trimmedSkill));
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    dispatch(removeSkill(skill));
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-4">
        <Label htmlFor="skill-input" className="text-lg font-semibold flex items-center gap-2">
            Skillsets
        </Label>
        <form onSubmit={(e) => { e.preventDefault(); handleAddSkill(newSkill); }} className="flex gap-2">
          <Input
            id="skill-input"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Search or type a skill..."
            className="flex-1"
          />
          <Button type="submit" variant="default" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Skill
          </Button>
        </form>
        
        <div className="flex flex-wrap gap-2.5 min-h-[40px] p-4 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/30">
          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground italic w-full text-center py-2">Start adding skills above or pick from suggestions below.</p>
          ) : (
            skills.map((skill) => (
              <Badge 
                key={skill} 
                className="group pl-3 pr-1 py-1.5 text-sm bg-primary text-primary-foreground border-transparent gap-1.5 transition-all animate-in zoom-in-95"
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="rounded-full p-0.5 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
                <Sparkles className="h-4 w-4 fill-primary/20" />
                Suggested for you
            </h3>
            {isLoadingSuggestions && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        
        <div className="bg-white rounded-2xl border p-5 shadow-xs">
          <div className="flex flex-wrap gap-2">
            {isLoadingSuggestions ? (
                Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-8 w-24 bg-muted animate-pulse rounded-full" />
                ))
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion) => {
                const isSelected = skills.includes(suggestion);
                return (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={isSelected}
                    onClick={() => handleAddSkill(suggestion)}
                    className={`
                        inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-sm transition-all duration-200
                        ${isSelected 
                          ? "bg-green-50 border-green-200 text-green-700 cursor-default" 
                          : "bg-white border-gray-200 text-gray-700 hover:border-primary hover:text-primary hover:bg-primary/5 hover:scale-105 active:scale-95"
                        }
                    `}
                  >
                    {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5 opacity-50" />}
                    {suggestion}
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground py-4 w-full text-center">No suggestions available at the moment.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <Button type="button" variant="outline" className="px-8" onClick={onBack}>
          Back
        </Button>
        <Button 
          type="button" 
          onClick={onNext}
          disabled={skills.length === 0}
          className="px-8 shadow-md"
        >
          Next Step
        </Button>
      </div>
    </div>
  );
}
