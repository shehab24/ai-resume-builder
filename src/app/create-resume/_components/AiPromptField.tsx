"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";

interface AiPromptFieldProps {
    prompt: string;
    setPrompt: (value: string) => void;
    handleGenerate: () => void;
    isGenerating: boolean;
}

export function AiPromptField({ prompt, setPrompt, handleGenerate, isGenerating }: AiPromptFieldProps) {
    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Step 2: Tell Us About Yourself
                </CardTitle>
                <CardDescription>Share your experience, skills, and education</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="prompt" className="text-base font-medium">Your Professional Details</Label>
                    <Textarea
                        id="prompt"
                        placeholder="Example: I am a Full Stack Developer with 5 years of experience in React, Node.js, and MongoDB. I have built scalable web applications for e-commerce and fintech companies. I hold a B.S. in Computer Science from MIT and am proficient in TypeScript, AWS, and Docker..."
                        className="min-h-[200px] text-base resize-none"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                        💡 Tip: Include your job title, years of experience, key skills, education, and notable achievements
                    </p>
                </div>
                <Button
                    className="w-full h-12 text-lg font-semibold"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    size="lg"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Generating Your Resume...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Generate Resume with AI
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
