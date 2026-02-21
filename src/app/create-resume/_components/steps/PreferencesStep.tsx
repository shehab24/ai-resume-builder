"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { preferencesSchema, PreferencesFormData } from "../../../../lib/validations/resume";
import { useAppDispatch, useAppSelector } from "../../../../lib/store/hooks";
import { updatePreferences } from "../../../../lib/store/resumeSlice";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PreferencesStepProps {
  onBack: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function PreferencesStep({ onBack, onGenerate, isGenerating }: PreferencesStepProps) {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector((state) => state.resume.preferences);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: preferences,
    mode: "onChange",
  });

  const selectedLanguage = watch("language");
  const selectedTone = watch("tone");

  const onSubmit = (data: PreferencesFormData) => {
    dispatch(updatePreferences(data));
    onGenerate();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Resume Language</Label>
          <Select
            value={selectedLanguage}
            onValueChange={(val) => setValue("language", val, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Spanish">Spanish</SelectItem>
              <SelectItem value="French">French</SelectItem>
              <SelectItem value="German">German</SelectItem>
              <SelectItem value="Bengali">Bengali</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tone of Voice</Label>
          <Select
            value={selectedTone}
            onValueChange={(val) => setValue("tone", val, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Professional">Professional</SelectItem>
              <SelectItem value="Creative">Creative</SelectItem>
              <SelectItem value="Casual">Casual</SelectItem>
              <SelectItem value="Academic">Academic</SelectItem>
              <SelectItem value="Bold">Bold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Ready to generate?
        </h4>
        <p className="text-sm text-muted-foreground">
          We'll use all the structured information you've provided to craft a high-impact, professional resume. You can still edit the content after generation.
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isGenerating}>
          Back
        </Button>
        <Button 
          type="submit" 
          disabled={!isValid || isGenerating}
          className="bg-primary hover:bg-primary/90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate My Resume
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
