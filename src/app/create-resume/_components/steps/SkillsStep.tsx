"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../lib/store/hooks";
import { addSkill, removeSkill, setSkills } from "../../../../lib/store/resumeSlice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface SkillsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function SkillsStep({ onNext, onBack }: SkillsStepProps) {
  const dispatch = useAppDispatch();
  const skills = useAppSelector((state) => state.resume.skills);
  const [newSkill, setNewSkill] = useState("");

  const handleAddSkill = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      dispatch(addSkill(newSkill.trim()));
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    dispatch(removeSkill(skill));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label htmlFor="skill-input">Skills</Label>
        <form onSubmit={handleAddSkill} className="flex gap-2">
          <Input
            id="skill-input"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="e.g. React, Node.js, Project Management"
          />
          <Button type="submit" variant="secondary">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </form>
        
        <div className="flex flex-wrap gap-2 pt-2">
          {skills.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No skills added yet.</p>
          )}
          {skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="px-3 py-1 text-sm bg-primary/10 hover:bg-primary/20 transition-colors">
              {skill}
              <button
                onClick={() => handleRemoveSkill(skill)}
                className="ml-2 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          type="button" 
          onClick={onNext}
          disabled={skills.length === 0}
        >
          Next Step
        </Button>
      </div>
    </div>
  );
}
