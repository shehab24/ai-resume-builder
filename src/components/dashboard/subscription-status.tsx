"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface SubscriptionStatusProps {
    subscription: any;
}

export function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
    const { subscribe, loading } = useSubscription();

    const isPro = subscription?.status === 'ACTIVE' && subscription?.plan === 'PRO';

    if (isPro) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Subscription Status</CardTitle>
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>
                    </div>
                    <CardDescription>You are currently on the Pro plan</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Plan</span>
                            <span className="font-medium">Pro</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Expires on</span>
                            <span className="font-medium">
                                {new Date(subscription.endDate).toLocaleDateString()}
                            </span>
                        </div>
                        <Button className="w-full" variant="outline" onClick={() => subscribe('PRO', 999)} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Extend Subscription
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Subscription Status</CardTitle>
                    <Badge variant="secondary">Free</Badge>
                </div>
                <CardDescription>Upgrade to unlock premium features</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    You are currently on the Free plan. Upgrade to Pro for unlimited AI resumes and more.
                </p>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="w-full">Upgrade to Pro</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Upgrade to Pro</DialogTitle>
                            <DialogDescription>
                                Unlock all features for just ৳999/month
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span>Unlimited AI Resumes</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span>Priority Support</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span>Advanced Analytics</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span>Unlimited Job Applications</span>
                                </li>
                            </ul>
                            <Button onClick={() => subscribe('PRO', 999)} disabled={loading} className="w-full mt-4">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Pay ৳999
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
