"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { experienceSchema } from "../../../../lib/validations/resume";
import { useAppDispatch, useAppSelector } from "../../../../lib/store/hooks";
import { setExperience } from "../../../../lib/store/resumeSlice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Sparkles, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ReusableDateInput } from "@/components/ui/reusable-date-input";
import { z } from "zod";
import { toast } from "sonner";

const experienceListSchema = z.object({
  experience: z.array(experienceSchema).min(1, "At least one experience is required"),
});

type ExperienceListFormData = z.infer<typeof experienceListSchema>;

interface ExperienceStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ExperienceStep({ onNext, onBack }: ExperienceStepProps) {
  const dispatch = useAppDispatch();
  const experiences = useAppSelector((state) => state.resume.experience);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<number, string[]>>({});

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExperienceListFormData>({
    resolver: zodResolver(experienceListSchema),
    defaultValues: {
      experience: experiences.length > 0 
        ? experiences 
        : [{ position: "", company: "", startDate: "", endDate: "", isCurrentlyWorking: false, description: "" }] as any,
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "experience",
  });

  const watchExperiences = watch("experience");

  const generateWithAI = async (index: number) => {
    const exp = watchExperiences[index];
    if (!exp.position || !exp.company) {
      toast.error("Please fill position and company first");
      return;
    }

    setGeneratingIndex(index);
    try {
      const response = await fetch("/api/ai/generate-experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: exp.position,
          company: exp.company,
          currentDescription: exp.description,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate description");
      const data = await response.json();
      setAiSuggestions(prev => ({ ...prev, [index]: data.versions }));
      toast.success("Generated 2 versions for you!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate description");
    } finally {
      setGeneratingIndex(null);
    }
  };

  const useSuggestion = (index: number, suggestion: string) => {
    setValue(`experience.${index}.description`, suggestion);
    setAiSuggestions(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const onSubmit = (data: ExperienceListFormData) => {
    const experiencesWithIds = data.experience.map((exp, idx) => ({
      ...exp,
      id: (exp as any).id || `exp-${Date.now()}-${idx}`
    }));
    dispatch(setExperience(experiencesWithIds as any));
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-6">
        {fields.map((field, index) => {
          const isCurrentlyWorking = watchExperiences[index]?.isCurrentlyWorking;
          const isPositionFilled = watchExperiences[index]?.position?.length > 1;
          const isCompanyFilled = watchExperiences[index]?.company?.length > 1;
          const isStartDateFilled = !!watchExperiences[index]?.startDate;
          const isEndDateFilled = isCurrentlyWorking || !!watchExperiences[index]?.endDate;
          
          const isReadyToDescribe = isPositionFilled && isCompanyFilled && isStartDateFilled && isEndDateFilled;

          return (
            <div key={field.id} className="p-4 border-2 rounded-xl relative space-y-4 shadow-sm bg-white">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input {...register(`experience.${index}.position`)} placeholder="Software Engineer" />
                  {errors.experience?.[index]?.position && (
                    <p className="text-sm text-red-500">{errors.experience[index].position?.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input {...register(`experience.${index}.company`)} placeholder="Acme Inc." />
                  {errors.experience?.[index]?.company && (
                    <p className="text-sm text-red-500">{errors.experience[index].company?.message}</p>
                  )}
                </div>

                <ReusableDateInput
                  label="Start Date"
                  {...register(`experience.${index}.startDate`)}
                  error={errors.experience?.[index]?.startDate?.message}
                />

                <div className="space-y-2">
                  <ReusableDateInput
                    label="End Date"
                    {...register(`experience.${index}.endDate`)}
                    disabled={isCurrentlyWorking}
                    error={errors.experience?.[index]?.endDate?.message}
                  />
                  
                  <div className="flex items-center space-x-2 pt-1 ml-1">
                    <Controller
                      name={`experience.${index}.isCurrentlyWorking`}
                      control={control}
                      render={({ field: checkboxField }) => (
                        <Checkbox
                          id={`current-${index}`}
                          checked={checkboxField.value}
                          onCheckedChange={(checked) => {
                            checkboxField.onChange(checked);
                            if (checked) {
                              setValue(`experience.${index}.endDate`, "");
                            }
                          }}
                          className="rounded"
                        />
                      )}
                    />
                    <label
                      htmlFor={`current-${index}`}
                      className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600"
                    >
                      I currently work here
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <Label className={!isReadyToDescribe ? "opacity-50" : ""}>Description</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!isReadyToDescribe || generatingIndex === index}
                    onClick={() => generateWithAI(index)}
                    className="h-8 gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer"
                  >
                    {generatingIndex === index ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Generate with AI
                  </Button>
                </div>
                
                <Textarea
                  {...register(`experience.${index}.description`)}
                  placeholder={
                    isReadyToDescribe 
                    ? "Describe your achievements... (or use AI to generate)" 
                    : "Fill role details first to unlock description"
                  }
                  disabled={!isReadyToDescribe}
                  className="min-h-[120px] resize-y"
                />
                
                {aiSuggestions[index] && (
                  <div className="mt-4 space-y-3 rounded-lg border bg-blue-50/50 p-4 border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">AI Suggestions - Pick one to use:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {aiSuggestions[index].map((suggest, sIdx) => (
                        <div 
                          key={sIdx} 
                          className="p-3 bg-white border border-blue-200 rounded-md shadow-xs hover:border-blue-400 transition-colors group relative cursor-pointer"
                          onClick={() => useSuggestion(index, suggest)}
                        >
                          <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-wrap">{suggest}</p>
                          <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">Click to apply</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-[10px] h-6 text-gray-500 hover:text-gray-700"
                        onClick={() => setAiSuggestions(prev => {
                            const next = {...prev};
                            delete next[index];
                            return next;
                        })}
                    >
                        Dismiss suggestions
                    </Button>
                  </div>
                )}

                {errors.experience?.[index]?.description && (
                  <p className="text-sm text-red-500">{errors.experience[index].description?.message}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed py-6 hover:bg-gray-50 hover:border-primary/50 transition-colors"
        onClick={() => append({ position: "", company: "", startDate: "", endDate: "", isCurrentlyWorking: false, description: "" } as any)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Experience
      </Button>

      <div className="flex justify-between pt-6 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">
          Next Step
        </Button>
      </div>
    </form>
  );
}
