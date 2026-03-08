"use client";

import { Button } from "@/components/ui/button";
import { Edit, Download, Loader2, FileText, X } from "lucide-react";

interface ResumePreviewActionsProps {
    isEditMode: boolean;
    setShowDesignPanel: (show: boolean) => void;
    setShowEditMode: (show: boolean) => void;
    handleSaveResume: () => void;
    isGenerating: boolean;
}

export function ResumePreviewActions({
    isEditMode,
    setShowDesignPanel,
    setShowEditMode,
    handleSaveResume,
    isGenerating
}: ResumePreviewActionsProps) {
    return (
        <div className="flex gap-3">
            <Button
                variant="outline"
                size="default"
                onClick={() => setShowDesignPanel(true)}
            >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Design
            </Button>
            
            {!isEditMode ? (
                <>
                    <Button
                        variant="outline"
                        size="default"
                        onClick={() => setShowEditMode(true)}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        onClick={handleSaveResume}
                        className="bg-black hover:bg-gray-800 text-white"
                        disabled={isGenerating}
                        size="default"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Downloading...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                            </>
                        )}
                    </Button>
                </>
            ) : (
                <>
                    <Button
                        variant="outline"
                        size="default"
                        onClick={() => setShowEditMode(false)}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="default"
                        onClick={() => setShowEditMode(false)}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveResume}
                        className="bg-black hover:bg-gray-800 text-white"
                        disabled={isGenerating}
                        size="default"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <FileText className="mr-2 h-4 w-4" />
                                Save
                            </>
                        )}
                    </Button>
                </>
            )}
        </div>
    );
}
