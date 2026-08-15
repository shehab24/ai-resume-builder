"use client";

import { useState, useEffect } from "react";
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
  const [jobTitleOptions, setJobTitleOptions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    register,
    handleSubmit,
    control: formControl,
    formState: { errors, isValid },
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      ...basicInfo,
      careerLevel: "Student",
    },
    mode: "onChange",
  });

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setJobTitleOptions([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/job-suggestions?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setJobTitleOptions(data.suggestions || []);
      } catch (error) {
        console.error("Error fetching job suggestions:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
          <Controller
            name="title"
            control={formControl}
            render={({ field }) => (
              <ReusableSelect
                label="Job Title"
                placeholder="Search job title..."
                isSearchable={true}
                isLoading={isSearching}
                options={jobTitleOptions}
                value={field.value ? { value: field.value, label: field.value } : null}
                onInputChange={(newValue, actionMeta) => {
                  if (actionMeta.action === "input-change") {
                    setSearchQuery(newValue);
                  }
                }}
                onChange={(option: any) => field.onChange(option?.value)}
                error={errors.title?.message}
              />
            )}
          />
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
          <Input id="phone" {...register("phone")} placeholder="e.g. 01700000000" />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...register("location")} placeholder="e.g. Dhaka, Bangladesh" />
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
