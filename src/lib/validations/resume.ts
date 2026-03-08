import { z } from "zod";

export const basicInfoSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  title: z.string().min(2, "Job title is required"),
  yearsOfExperience: z.string().min(1, "Years of experience is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number is required"),
  location: z.string().min(2, "Location is required"),
});

export const experienceSchema = z.object({
  position: z.string().min(2, "Position is required"),
  company: z.string().min(2, "Company is required"),
  startDate: z.string().min(2, "Start date is required"),
  endDate: z.string().min(2, "End date is required"),
  description: z.string().min(10, "Description should be at least 10 characters"),
});

export const educationSchema = z.object({
  school: z.string().min(2, "School name is required"),
  degree: z.string().min(2, "Degree is required"),
  fieldOfStudy: z.string().min(2, "Field of study is required"),
  startDate: z.string().min(2, "Start date is required"),
  endDate: z.string().optional(),
  isCurrentlyStudying: z.boolean().optional(),
});

export const preferencesSchema = z.object({
  language: z.string().min(2, "Language is required"),
  tone: z.string().min(2, "Tone is required"),
});

export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type ExperienceFormData = z.infer<typeof experienceSchema>;
export type EducationFormData = z.infer<typeof educationSchema>;
export type PreferencesFormData = z.infer<typeof preferencesSchema>;
