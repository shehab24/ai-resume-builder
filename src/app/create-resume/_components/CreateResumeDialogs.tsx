"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X, LogIn } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";

interface CreateResumeDialogsProps {
    deleteDialogOpen: boolean;
    setDeleteDialogOpen: (open: boolean) => void;
    isDeleting: boolean;
    handleDeleteConfirm: () => void;
    previewImage: string | null;
    setPreviewImage: (image: string | null) => void;
    showLoginPrompt: boolean;
    setShowLoginPrompt: (show: boolean) => void;
}

export function CreateResumeDialogs({
    deleteDialogOpen,
    setDeleteDialogOpen,
    isDeleting,
    handleDeleteConfirm,
    previewImage,
    setPreviewImage,
    showLoginPrompt,
    setShowLoginPrompt
}: CreateResumeDialogsProps) {
    return (
        <>
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Resume?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your resume.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Template Preview Dialog */}
            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center outline-none">
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-4 right-4 z-50 rounded-full shadow-lg border-2 border-white"
                            onClick={() => setPreviewImage(null)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        {previewImage && (
                            <img
                                src={previewImage}
                                alt="Template Preview"
                                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl bg-white"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Login Prompt Dialog */}
            <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center text-center space-y-4 py-6">
                        <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <LogIn className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">Sign in to Save Your Resume</h3>
                            <p className="text-sm text-muted-foreground">
                                Create a free account to generate, save, and download your AI-powered resume
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 w-full pt-4">
                            <SignInButton 
                                mode="modal"
                                fallbackRedirectUrl="/dashboard/job-seeker/resume/create"
                            >
                                <Button className="w-full" size="lg">
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Sign In to Continue
                                </Button>
                            </SignInButton>
                            <Button
                                variant="outline"
                                onClick={() => setShowLoginPrompt(false)}
                                className="w-full"
                            >
                                Continue Editing
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
