"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, TrendingUp } from "lucide-react";

export function ResumeScore({ score, skills }: { score: number; skills: string[] }) {
    const getRecommendations = (skills: string[]) => {
        // Mock recommendations based on skills
        if (skills.includes("React")) {
            return [
                { title: "Advanced React Patterns", price: "$49.99" },
                { title: "Next.js for Enterprise", price: "$59.99" },
            ];
        }
        return [
            { title: "Full Stack Web Development", price: "$99.99" },
            { title: "Mastering TypeScript", price: "$39.99" },
        ];
    };

    const recommendations = getRecommendations(skills);

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Resume Score
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-4xl font-bold">{score}/100</span>
                        <span className="text-sm text-muted-foreground">
                            {score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Improvement"}
                        </span>
                    </div>
                    <Progress value={score} className="h-3" />
                    <p className="text-sm text-muted-foreground">
                        Your resume is strong, but adding more quantitative results could improve your score.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Recommended Courses
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {recommendations.map((course, index) => (
                        <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                            <div>
                                <div className="font-medium">{course.title}</div>
                                <div className="text-sm text-muted-foreground">{course.price}</div>
                            </div>
                            <Button size="sm" variant="outline">View</Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
