"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye } from "lucide-react";
import { TEMPLATES } from "../constants";

interface TemplateSelectorProps {
    selectedTemplate: string;
    onSelect: (id: string) => void;
    onPreview: (image: string) => void;
}

export function TemplateSelector({ selectedTemplate, onSelect, onPreview }: TemplateSelectorProps) {
    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Step 1: Choose Your Template
                </CardTitle>
                <CardDescription>Select a design that matches your style and industry</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TEMPLATES.map((template) => (
                        <div
                            key={template.id}
                            className={`relative border-2 rounded-xl cursor-pointer transition-all duration-200 overflow-hidden group ${selectedTemplate === template.id
                                ? "border-primary ring-2 ring-primary ring-offset-2"
                                : "border-gray-200 hover:border-gray-400 hover:shadow-md"
                                }`}
                            onClick={() => onSelect(template.id)}
                        >
                            <div className="aspect-[210/297] w-full relative bg-gray-100">
                                <img
                                    src={template.image}
                                    alt={template.name}
                                    className="w-full h-full object-cover object-top"
                                />
                                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity duration-200 ${selectedTemplate === template.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="rounded-full h-10 w-10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPreview(template.image);
                                        }}
                                        title="Preview Template"
                                    >
                                        <Eye className="h-5 w-5" />
                                    </Button>
                                    {selectedTemplate === template.id ? (
                                        <div className="bg-primary text-white rounded-full p-2 shadow-lg">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="default"
                                            className="rounded-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelect(template.id);
                                            }}
                                        >
                                            Select
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-base mb-1">{template.name}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
