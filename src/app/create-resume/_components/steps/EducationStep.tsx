"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { educationSchema } from "../../../../lib/validations/resume";
import { useAppDispatch, useAppSelector } from "../../../../lib/store/hooks";
import { setEducation } from "../../../../lib/store/resumeSlice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { z } from "zod";

const educationListSchema = z.object({
  education: z.array(educationSchema),
});

type EducationListFormData = z.infer<typeof educationListSchema>;

interface EducationStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function EducationStep({ onNext, onBack }: EducationStepProps) {
  const dispatch = useAppDispatch();
  const education = useAppSelector((state) => state.resume.education);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EducationListFormData>({
    resolver: zodResolver(educationListSchema),
    defaultValues: { education: education.length > 0 ? education : [{ school: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" }] as any },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "education",
  });

  const onSubmit = (data: EducationListFormData) => {
    const educationWithIds = data.education.map((edu, idx) => ({
      ...edu,
      id: (edu as any).id || `edu-${Date.now()}-${idx}`
    }));
    dispatch(setEducation(educationWithIds as any));
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
              <div className="space-y-2 col-span-2">
                <Label>School / University</Label>
                <Input {...register(`education.${index}.school`)} placeholder="Harvard University" />
                {errors.education?.[index]?.school && (
                  <p className="text-sm text-red-500">{errors.education[index].school?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Degree</Label>
                <Input {...register(`education.${index}.degree`)} placeholder="Bachelor of Science" />
                {errors.education?.[index]?.degree && (
                  <p className="text-sm text-red-500">{errors.education[index].degree?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Field of Study</Label>
                <Input {...register(`education.${index}.fieldOfStudy`)} placeholder="Computer Science" />
                {errors.education?.[index]?.fieldOfStudy && (
                  <p className="text-sm text-red-500">{errors.education[index].fieldOfStudy?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input {...register(`education.${index}.startDate`)} placeholder="2016" />
                {errors.education?.[index]?.startDate && (
                  <p className="text-sm text-red-500">{errors.education[index].startDate?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input {...register(`education.${index}.endDate`)} placeholder="2020" />
                {errors.education?.[index]?.endDate && (
                  <p className="text-sm text-red-500">{errors.education[index].endDate?.message}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={() => append({ school: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" } as any)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Education
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
