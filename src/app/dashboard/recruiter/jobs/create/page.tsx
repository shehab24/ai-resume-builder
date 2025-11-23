"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, X, Briefcase } from "lucide-react";

export default function CreateJobPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        company: "",
        description: "",
        location: "",
        jobType: "",
        workMode: "",
        experienceLevel: "",
        salaryMin: "",
        salaryMax: "",
        requirements: "",
        benefits: "",
        applicationDeadline: "",
        tasks: [""], // Array of task strings
    });

    const addTask = () => {
        setFormData({ ...formData, tasks: [...formData.tasks, ""] });
    };

    const removeTask = (index: number) => {
        setFormData({
            ...formData,
            tasks: formData.tasks.filter((_, i) => i !== index),
        });
    };

    const updateTask = (index: number, value: string) => {
        const newTasks = [...formData.tasks];
        newTasks[index] = value;
        setFormData({ ...formData, tasks: newTasks });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("/api/jobs/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    company: formData.company,
                    description: formData.description,
                    location: formData.location,
                    jobType: formData.jobType,
                    workMode: formData.workMode,
                    experienceLevel: formData.experienceLevel,
                    salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
                    salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null,
                    requirements: formData.requirements.split(",").map((r) => r.trim()).filter(r => r),
                    benefits: formData.benefits.split(",").map((b) => b.trim()).filter(b => b),
                    applicationDeadline: formData.applicationDeadline || null,
                    tasks: formData.tasks.filter(t => t.trim()),
                }),
            });

            if (!response.ok) throw new Error("Failed to create job");

            toast.success("Job posted successfully!");
            router.push("/dashboard/recruiter");
        } catch (error) {
            console.error(error);
            toast.error("Failed to post job.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Briefcase className="h-8 w-8" />
                    Post a New Job
                </h1>
                <p className="text-muted-foreground mt-2">Fill in the details to create a professional job posting</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Essential details about the position</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Job Title *</Label>
                                <Input
                                    id="title"
                                    required
                                    placeholder="e.g., Senior Full Stack Developer"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Company Name *</Label>
                                <Input
                                    id="company"
                                    required
                                    placeholder="e.g., TechCorp Inc."
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Job Description *</Label>
                            <Textarea
                                id="description"
                                required
                                className="min-h-[150px]"
                                placeholder="Describe the role, responsibilities, and what makes this opportunity unique..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="requirements">Requirements (comma separated) *</Label>
                            <Textarea
                                id="requirements"
                                required
                                placeholder="React, Node.js, 5+ years experience, TypeScript"
                                value={formData.requirements}
                                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Job Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Job Details</CardTitle>
                        <CardDescription>Specify the type and nature of work</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="jobType">Job Type</Label>
                                <Select value={formData.jobType} onValueChange={(value) => setFormData({ ...formData, jobType: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select job type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Full-time">Full-time</SelectItem>
                                        <SelectItem value="Part-time">Part-time</SelectItem>
                                        <SelectItem value="Contract">Contract</SelectItem>
                                        <SelectItem value="Internship">Internship</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="workMode">Work Mode</Label>
                                <Select value={formData.workMode} onValueChange={(value) => setFormData({ ...formData, workMode: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select work mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Remote">Remote</SelectItem>
                                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                                        <SelectItem value="On-site">On-site</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="experienceLevel">Experience Level</Label>
                                <Select value={formData.experienceLevel} onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select experience level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Entry">Entry Level</SelectItem>
                                        <SelectItem value="Mid">Mid Level</SelectItem>
                                        <SelectItem value="Senior">Senior</SelectItem>
                                        <SelectItem value="Lead">Lead/Principal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    placeholder="e.g., San Francisco, CA or Remote"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Compensation & Benefits */}
                <Card>
                    <CardHeader>
                        <CardTitle>Compensation & Benefits</CardTitle>
                        <CardDescription>Salary range and additional perks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="salaryMin">Minimum Salary (USD)</Label>
                                <Input
                                    id="salaryMin"
                                    type="number"
                                    placeholder="e.g., 100000"
                                    value={formData.salaryMin}
                                    onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="salaryMax">Maximum Salary (USD)</Label>
                                <Input
                                    id="salaryMax"
                                    type="number"
                                    placeholder="e.g., 150000"
                                    value={formData.salaryMax}
                                    onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="benefits">Benefits (comma separated)</Label>
                            <Textarea
                                id="benefits"
                                placeholder="Health insurance, 401k, Stock options, Unlimited PTO"
                                value={formData.benefits}
                                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="applicationDeadline">Application Deadline</Label>
                            <Input
                                id="applicationDeadline"
                                type="date"
                                value={formData.applicationDeadline}
                                onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Tasks for Applicants */}
                <Card>
                    <CardHeader>
                        <CardTitle>Application Tasks (Optional)</CardTitle>
                        <CardDescription>
                            Add tasks that will be automatically sent to applicants. They'll need to submit these when applying.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {formData.tasks.map((task, index) => (
                            <div key={index} className="flex gap-2">
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor={`task-${index}`}>Task {index + 1}</Label>
                                    <Textarea
                                        id={`task-${index}`}
                                        placeholder="e.g., Build a simple React component that displays a list of users..."
                                        value={task}
                                        onChange={(e) => updateTask(index, e.target.value)}
                                        className="min-h-[80px]"
                                    />
                                </div>
                                {formData.tasks.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="mt-8"
                                        onClick={() => removeTask(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={addTask} className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Another Task
                        </Button>
                    </CardContent>
                </Card>

                <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Post Job
                </Button>
            </form>
        </div>
    );
}
