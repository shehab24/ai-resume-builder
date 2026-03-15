"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { basicInfoSchema, BasicInfoFormData } from "../../../../lib/validations/resume";
import { useAppDispatch, useAppSelector } from "../../../../lib/store/hooks";
import { updateBasicInfo } from "../../../../lib/store/resumeSlice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ReusableSelect } from "@/components/ui/reusable-select";
import { Controller } from "react-hook-form";

interface BasicInfoStepProps {
  onNext: () => void;
  onBack?: () => void;
}

export function BasicInfoStep({ onNext, onBack }: BasicInfoStepProps) {
  const dispatch = useAppDispatch();
  const basicInfo = useAppSelector((state) => state.resume.basicInfo);

  const {
    register,
    handleSubmit,
    control: formControl,
    formState: { errors, isValid },
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: basicInfo,
    mode: "onChange",
  });

  const onSubmit = (data: BasicInfoFormData) => {
    dispatch(updateBasicInfo(data));
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" {...register("fullName")} placeholder="John Doe" />
          {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Job Title</Label>
          <Input id="title" {...register("title")} placeholder="Software Engineer" />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Controller
            name="careerLevel"
            control={formControl}
            render={({ field }) => (
              <ReusableSelect
                label="Career Level"
                placeholder="Select your career level..."
                options={[
                  { value: "Student", label: "Student" },
                  { value: "Recent Graduate", label: "Recent Graduate" },
                  { value: "Entry Level", label: "Entry Level" },
                  { value: "Career Switcher", label: "Career Switcher" },
                ]}
                value={field.value ? { value: field.value, label: field.value } : null}
                onChange={(option: any) => field.onChange(option?.value)}
                error={errors.careerLevel?.message}
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} placeholder="john@example.com" />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} placeholder="+1 234 567 890" />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...register("location")} placeholder="New York, NY" />
          {errors.location && <p className="text-sm text-red-500">{errors.location.message}</p>}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        {onBack ? (
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        ) : (
          <div></div>
        )}
        <Button type="submit" disabled={!isValid}>
          Next Step
        </Button>
      </div>
    </form>
  );
}
