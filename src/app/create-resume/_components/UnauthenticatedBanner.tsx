"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function UnauthenticatedBanner() {
    return (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                            Try Our AI Resume Builder - No Sign Up Required!
                        </h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            Fill in your details below and preview your AI-enhanced resume. You'll only need to sign in when you're ready to save and download.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
