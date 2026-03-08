"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, X } from "lucide-react";
import { TEMPLATES } from "../constants";

interface TemplateSelectorProps {
    selectedTemplate: string;
    onSelect: (id: string) => void;
    onPreview: (image: string) => void;
}

export function TemplateSelector({ selectedTemplate, onSelect, onPreview }: TemplateSelectorProps) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState("");

    const handlePreview = (image: string) => {
        setPreviewImage(image);
        setPreviewOpen(true);
        onPreview(image);
    };

    return (
        <>
            <Card className="border-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Step 1: Choose Your Template
                    </CardTitle>
                    <CardDescription className="text-sm">Select a design that matches your style and industry</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {TEMPLATES.map((template) => (
                            <div
                                key={template.id}
                                className={`relative border-2 rounded-lg cursor-pointer transition-all duration-200 overflow-hidden group ${selectedTemplate === template.id
                                    ? "border-primary ring-2 ring-primary ring-offset-2 shadow-lg"
                                    : "border-gray-200 hover:border-primary hover:shadow-md"
                                    }`}
                                onClick={() => onSelect(template.id)}
                            >
                                <div className="aspect-[210/297] w-full relative bg-gray-100">
                                    <img
                                        src={template.image}
                                        alt={template.name}
                                        className="w-full h-full object-cover object-top"
                                    />
                                    <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${selectedTemplate === template.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="rounded-full h-8 w-8"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePreview(template.image);
                                            }}
                                            title="Preview Template"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {selectedTemplate === template.id && (
                                        <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 bg-white">
                                    <h3 className="font-semibold text-xs mb-1 truncate">{template.name}</h3>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{template.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Full Screen Preview Modal */}
            {previewOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
                        <button
                            onClick={() => setPreviewOpen(false)}
                            className="sticky top-0 right-0 float-right p-2 hover:bg-gray-100 transition-colors z-10"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <div className="p-6">
                            <img
                                src={previewImage}
                                alt="Template Preview"
                                className="w-full h-auto"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
