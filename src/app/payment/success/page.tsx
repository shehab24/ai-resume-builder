"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const tran_id = searchParams.get("tran_id");
    const router = useRouter();

    return (
        <div className="container mx-auto py-20 px-4 flex justify-center">
            <Card className="max-w-md w-full text-center">
                <CardHeader>
                    <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-4">
                        <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-2xl text-green-600 dark:text-green-400">Payment Successful!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-muted-foreground">
                        Thank you for your subscription. Your payment has been processed successfully.
                    </p>

                    {tran_id && (
                        <div className="bg-muted p-3 rounded-lg text-sm font-mono">
                            Transaction ID: {tran_id}
                        </div>
                    )}

                    <div className="pt-4">
                        <Button className="w-full" asChild>
                            <Link href="/dashboard">
                                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <PaymentSuccessContent />
        </Suspense>
    );
}
