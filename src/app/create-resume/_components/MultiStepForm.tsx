"use client";

import { useState } from "react";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { ExperienceStep } from "./steps/ExperienceStep";
import { SkillsStep } from "./steps/SkillsStep";
import { EducationStep } from "./steps/EducationStep";
import { PreferencesStep } from "./steps/PreferencesStep";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppSelector } from "@/lib/store/hooks";
import { buildAIPrompt } from "@/lib/utils/resume";
import { Sparkles } from "lucide-react";

interface MultiStepFormProps {
  handleGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

const STEPS = [
  "Basic Info",
  "Work Experience",
  "Skills",
  "Education",
  "Preferences"
];

export function MultiStepForm({ handleGenerate, isGenerating }: MultiStepFormProps) {
  const [step, setStep] = useState(1);
  const resumeState = useAppSelector((state) => state.resume);

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const onGenerateTrigger = () => {
    const prompt = buildAIPrompt(resumeState);
    handleGenerate(prompt);
  };

  const progress = (step / 5) * 100;

  return (
    <Card className="border-2 shadow-xl overflow-hidden">
      <CardHeader className="bg-primary/5 border-b">
        <div className="flex justify-between items-center mb-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Building Your Resume
            </CardTitle>
            <CardDescription>Step {step} of 5: {STEPS[step - 1]}</CardDescription>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Completed</p>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="p-6 md:p-8">
        <div className="transition-all duration-300 ease-in-out">
          {step === 1 && <BasicInfoStep onNext={nextStep} />}
          {step === 2 && <ExperienceStep onNext={nextStep} onBack={prevStep} />}
          {step === 3 && <SkillsStep onNext={nextStep} onBack={prevStep} />}
          {step === 4 && <EducationStep onNext={nextStep} onBack={prevStep} />}
          {step === 5 && (
            <PreferencesStep 
              onBack={prevStep} 
              onGenerate={onGenerateTrigger} 
              isGenerating={isGenerating} 
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
