"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { experienceSchema } from "../../../../lib/validations/resume";
import { useAppDispatch, useAppSelector } from "../../../../lib/store/hooks";
import { setExperience } from "../../../../lib/store/resumeSlice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { z } from "zod";

const experienceListSchema = z.object({
  experience: z.array(experienceSchema),
});

type ExperienceListFormData = z.infer<typeof experienceListSchema>;

interface ExperienceStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ExperienceStep({ onNext, onBack }: ExperienceStepProps) {
  const dispatch = useAppDispatch();
  const experiences = useAppSelector((state) => state.resume.experience);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ExperienceListFormData>({
    resolver: zodResolver(experienceListSchema),
    defaultValues: { experience: experiences.length > 0 ? experiences : [{ position: "", company: "", startDate: "", endDate: "", description: "" }] as any },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "experience",
  });

  const onSubmit = (data: ExperienceListFormData) => {
    // Ensure each item has an ID for consistency even if we replace the whole array
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
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border-2 rounded-xl relative space-y-4">
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

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input {...register(`experience.${index}.startDate`)} placeholder="Jan 2020" />
                {errors.experience?.[index]?.startDate && (
                  <p className="text-sm text-red-500">{errors.experience[index].startDate?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input {...register(`experience.${index}.endDate`)} placeholder="Present" />
                {errors.experience?.[index]?.endDate && (
                  <p className="text-sm text-red-500">{errors.experience[index].endDate?.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                {...register(`experience.${index}.description`)}
                placeholder="Describe your achievements..."
                className="min-h-[100px]"
              />
              {errors.experience?.[index]?.description && (
                <p className="text-sm text-red-500">{errors.experience[index].description?.message}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={() => append({ position: "", company: "", startDate: "", endDate: "", description: "" } as any)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Experience
      </Button>

      <div className="flex justify-between pt-4">
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
