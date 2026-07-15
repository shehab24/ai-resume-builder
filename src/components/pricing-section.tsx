
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, CheckCircle2, Loader2, Sparkles, Zap } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";

export function PricingSection() {
    const { subscribe, loading } = useSubscription();

    return (
        <section id="pricing" className="py-24 px-6 lg:px-12 bg-gradient-to-b from-white to-slate-50/80 border-t border-slate-200/50">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold mb-4">
                        <Sparkles className="h-3 w-3" />
                        <span>Flexible Pricing Plans</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-slate-600 text-lg max-w-md mx-auto">
                        Accelerate your career search with zero hidden fees. Choose a plan that matches your goals.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-stretch">
                    {/* Free Plan */}
                    <Card className="flex flex-col border border-slate-200/80 bg-white rounded-2xl hover:shadow-xl transition-all duration-300">
                        <CardHeader className="pt-8 px-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl font-black text-slate-900">Free</CardTitle>
                                    <CardDescription className="text-slate-500 mt-1">Get started with TalentFlow</CardDescription>
                                </div>
                                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                                    Starter
                                </span>
                            </div>
                            <div className="mt-6 flex items-baseline gap-1">
                                <span className="text-5xl font-black text-slate-900">৳0</span>
                                <span className="text-slate-500 text-sm font-semibold">/ month</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 px-8 py-6">
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                    <span>5 AI Auto-Applies per month</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                    <span>1 Active Resume generation</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                    <span>Basic job match scoring</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter className="pb-8 px-8">
                            <Button className="w-full h-11 font-bold border-slate-200 text-slate-500" variant="outline" disabled>
                                Current Plan
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Pro Plan */}
                    <Card className="flex flex-col border-2 border-blue-600 relative overflow-hidden bg-white shadow-2xl md:-translate-y-4 rounded-2xl z-10">
                        {/* Premium Ribbon */}
                        <div className="absolute top-4 right-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-md shadow-blue-500/10">
                                <Zap className="h-3.5 w-3.5 fill-white/20" />
                                POPULAR
                            </span>
                        </div>
                        
                        <CardHeader className="pt-10 px-8">
                            <div>
                                <CardTitle className="text-2xl font-black text-slate-900">Pro</CardTitle>
                                <CardDescription className="text-slate-500 mt-1">For serious job seekers & recruiters</CardDescription>
                            </div>
                            <div className="mt-6 flex items-baseline gap-1">
                                <span className="text-5xl font-black bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">৳999</span>
                                <span className="text-slate-500 text-sm font-semibold">/ month</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 px-8 py-6">
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3 text-sm text-slate-700">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                    <span className="font-semibold">Everything in Free plan</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-700">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                    <span>Unlimited Auto-Applies</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-700">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                    <span>Unlimited AI Resumes (PDF & ATS optimized)</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-700">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                    <span>Advanced Match analysis & resume feedback</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-700">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                    <span>Priority candidate support & setup</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter className="pb-10 px-8">
                            <Button
                                className="w-full h-12 font-bold bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all"
                                onClick={() => subscribe('PRO', 999)}
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Upgrade to Pro
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Enterprise Plan */}
                    <Card className="flex flex-col border border-slate-200/80 bg-white rounded-2xl hover:shadow-xl transition-all duration-300">
                        <CardHeader className="pt-8 px-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl font-black text-slate-900">Enterprise</CardTitle>
                                    <CardDescription className="text-slate-500 mt-1">For staffing teams & recruiters</CardDescription>
                                </div>
                                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                                    Teams
                                </span>
                            </div>
                            <div className="mt-6 flex items-baseline gap-1">
                                <span className="text-4xl font-black text-slate-900">Custom</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 px-8 py-6">
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                    <span className="font-semibold">Everything in Pro</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                    <span>Dedicated candidate managers</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                    <span>Custom external ATS integrations</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter className="pb-8 px-8">
                            <Button className="w-full h-11 font-bold border-slate-200 text-slate-700 hover:bg-slate-50" variant="outline">
                                Contact Sales
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </section>
    );
}

