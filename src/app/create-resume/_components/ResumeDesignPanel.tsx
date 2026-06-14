"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { TEMPLATES } from "../constants";

interface ResumeDesignPanelProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    selectedTemplate: string;
    setSelectedTemplate: (id: string) => void;
}

export function ResumeDesignPanel({ open, setOpen, selectedTemplate, setSelectedTemplate }: ResumeDesignPanelProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setOpen(false)}>
            <div 
                className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl p-6 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Customize Resume</h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                    Change the layout, font, and color theme of your resume.
                </p>

                {/* Layout Style */}
                <div className="space-y-4 mb-6">
                    <Label className="text-base font-semibold">Layout Style</Label>
                    {TEMPLATES.map((template) => (
                        <div
                            key={template.id}
                            className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                selectedTemplate === template.id
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedTemplate(template.id)}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedTemplate === template.id ? 'border-primary' : 'border-gray-300'
                            }`}>
                                {selectedTemplate === template.id && (
                                    <div className="w-3 h-3 rounded-full bg-primary" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">{template.name}</p>
                                <p className="text-xs text-muted-foreground">{template.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <Button
                    className="w-full"
                    onClick={() => setOpen(false)}
                >
                    Apply Changes
                </Button>
            </div>
        </div>
    );
}
