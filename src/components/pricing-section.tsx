
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";

export function PricingSection() {
    const { subscribe, loading } = useSubscription();

    return (
        <section id="pricing" className="py-20 px-6 lg:px-12 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
                    <p className="text-muted-foreground text-lg">Choose the plan that's right for you</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Free Plan */}
                    <Card className="flex flex-col bg-white">
                        <CardHeader>
                            <CardTitle className="text-2xl">Free</CardTitle>
                            <CardDescription>For getting started</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">৳0</span>
                                <span className="text-muted-foreground">/month</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span>Basic features</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span>5 job applications/month</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span>1 Resume</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" variant="outline" disabled>Current Plan</Button>
                        </CardFooter>
                    </Card>

                    {/* Pro Plan */}
                    <Card className="flex flex-col border-primary relative overflow-hidden bg-white shadow-lg scale-105 z-10">
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">
                            POPULAR
                        </div>
                        <CardHeader>
                            <CardTitle className="text-2xl">Pro</CardTitle>
                            <CardDescription>For serious job seekers & recruiters</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">৳999</span>
                                <span className="text-muted-foreground">/month</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span>Everything in Free</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span>Unlimited applications</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span>Priority support</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span>Advanced analytics</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span>AI Resume Builder (Unlimited)</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                onClick={() => subscribe('PRO', 999)}
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Subscribe Now
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Enterprise Plan */}
                    <Card className="flex flex-col bg-white">
                        <CardHeader>
                            <CardTitle className="text-2xl">Enterprise</CardTitle>
                            <CardDescription>For large teams</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">Custom</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span>Everything in Pro</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span>Dedicated account manager</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span>Custom integrations</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" variant="outline">Contact Sales</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </section>
    );
}
