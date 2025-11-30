"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";

interface UpgradePromptProps {
    title?: string;
    message?: string;
    feature?: string;
    price?: number; // Price in BDT (299 for job seekers, 999 for recruiters)
}

export function UpgradePrompt({
    title = "Upgrade to Pro",
    message = "This feature is only available for Pro users.",
    feature,
    price = 999 // Default to recruiter price
}: UpgradePromptProps) {
    const { subscribe, loading } = useSubscription();

    const handleUpgrade = () => {
        subscribe('PRO', price);
    };

    return (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Crown className="h-6 w-6 text-primary" />
                    <CardTitle className="text-xl">{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                    {message}
                </p>
                {feature && (
                    <p className="text-sm font-medium">
                        {feature}
                    </p>
                )}
                <div className="pt-2">
                    <Button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? (
                            <>Processing...</>
                        ) : (
                            <>
                                Upgrade to Pro - ৳{price}/month <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
