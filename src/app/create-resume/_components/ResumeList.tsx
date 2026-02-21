"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Star, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Resume } from "../constants";

interface ResumeListProps {
    resumes: Resume[];
    loading: boolean;
    settingDefault: string | null;
    handleSetDefault: (id: string, e: React.MouseEvent) => void;
    handleDeleteClick: (id: string, e: React.MouseEvent) => void;
}

export function ResumeList({ resumes, loading, settingDefault, handleSetDefault, handleDeleteClick }: ResumeListProps) {
    if (loading || resumes.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Your Resumes ({resumes.length})
                </CardTitle>
                <CardDescription>All your created resumes in one place</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {resumes.map((resume) => (
                        <Link
                            key={resume.id}
                            href={`/dashboard/job-seeker/resume/${resume.id}`}
                            className="block group"
                        >
                            <Card className={`hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer border-2 relative ${resume.isDefault ? 'border-primary bg-primary/5' : 'hover:border-primary'}`}>
                                <CardContent className="p-4">
                                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`h-8 w-8 p-0 ${resume.isDefault ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                                            onClick={(e) => handleSetDefault(resume.id, e)}
                                            title={resume.isDefault ? "Default Resume" : "Set as Default"}
                                        >
                                            {settingDefault === resume.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Star className={`h-4 w-4 ${resume.isDefault ? 'fill-current' : ''}`} />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={(e) => handleDeleteClick(resume.id, e)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                            <FileText className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold truncate">{resume.title}</h3>
                                                {resume.isDefault && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1">Default</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Created: {new Date(resume.createdAt).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Updated: {new Date(resume.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
