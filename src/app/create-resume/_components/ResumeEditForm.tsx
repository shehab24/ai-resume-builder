"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";

interface ResumeEditFormProps {
    editableResume: any;
    setEditableResume: (resume: any) => void;
}

export function ResumeEditForm({ editableResume, setEditableResume }: ResumeEditFormProps) {
    if (!editableResume) return null;

    return (
        <Card className="bg-white shadow-lg">
            <CardContent className="p-8 space-y-6">
                {/* Personal Info */}
                <div className="space-y-4">
                    <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mx-auto mb-4" />
                        <input
                            type="text"
                            className="text-center text-2xl font-bold border-b-2 border-transparent hover:border-gray-300 focus:border-primary outline-none w-full max-w-md mx-auto"
                            value={editableResume.personalInfo?.fullName || ''}
                            onChange={(e) => setEditableResume({
                                ...editableResume,
                                personalInfo: { ...editableResume.personalInfo, fullName: e.target.value }
                            })}
                            placeholder="Your Name"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                        <input
                            type="email"
                            className="px-4 py-2 border rounded-lg"
                            value={editableResume.personalInfo?.email || ''}
                            onChange={(e) => setEditableResume({
                                ...editableResume,
                                personalInfo: { ...editableResume.personalInfo, email: e.target.value }
                            })}
                            placeholder="Email"
                        />
                        <input
                            type="tel"
                            className="px-4 py-2 border rounded-lg"
                            value={editableResume.personalInfo?.phone || ''}
                            onChange={(e) => setEditableResume({
                                ...editableResume,
                                personalInfo: { ...editableResume.personalInfo, phone: e.target.value }
                            })}
                            placeholder="Phone"
                        />
                    </div>
                </div>

                {/* Professional Summary */}
                <div>
                    <h3 className="text-xl font-bold mb-2 uppercase">Professional Summary</h3>
                    <Textarea
                        className="min-h-[100px]"
                        value={editableResume.summary || ''}
                        onChange={(e) => setEditableResume({ ...editableResume, summary: e.target.value })}
                        placeholder="Your professional summary..."
                    />
                </div>

                {/* Experience */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold uppercase">Experience</h3>
                        <Button size="sm" variant="outline">
                            <span className="mr-1">+</span> Add
                        </Button>
                    </div>
                    {editableResume.experience?.map((exp: any, index: number) => (
                        <Card key={index} className="mb-4">
                            <CardContent className="pt-4 space-y-3">
                                <div className="flex justify-end">
                                    <Button size="sm" variant="ghost" className="text-red-500">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg font-semibold"
                                    value={exp.position}
                                    onChange={(e) => {
                                        const newExp = [...editableResume.experience];
                                        newExp[index].position = e.target.value;
                                        setEditableResume({ ...editableResume, experience: newExp });
                                    }}
                                    placeholder="Position"
                                />
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={exp.company}
                                    onChange={(e) => {
                                        const newExp = [...editableResume.experience];
                                        newExp[index].company = e.target.value;
                                        setEditableResume({ ...editableResume, experience: newExp });
                                    }}
                                    placeholder="Company"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        className="px-3 py-2 border rounded-lg text-sm"
                                        value={exp.startDate}
                                        onChange={(e) => {
                                            const newExp = [...editableResume.experience];
                                            newExp[index].startDate = e.target.value;
                                            setEditableResume({ ...editableResume, experience: newExp });
                                        }}
                                        placeholder="Start Date"
                                    />
                                    <input
                                        type="text"
                                        className="px-3 py-2 border rounded-lg text-sm"
                                        value={exp.endDate}
                                        onChange={(e) => {
                                            const newExp = [...editableResume.experience];
                                            newExp[index].endDate = e.target.value;
                                            setEditableResume({ ...editableResume, experience: newExp });
                                        }}
                                        placeholder="End Date"
                                    />
                                </div>
                                <Textarea
                                    className="min-h-[80px]"
                                    value={exp.description}
                                    onChange={(e) => {
                                        const newExp = [...editableResume.experience];
                                        newExp[index].description = e.target.value;
                                        setEditableResume({ ...editableResume, experience: newExp });
                                    }}
                                    placeholder="Description"
                                />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
