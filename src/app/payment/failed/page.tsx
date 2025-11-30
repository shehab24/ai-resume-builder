"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function PaymentFailedPage() {
    return (
        <div className="container mx-auto py-20 px-4 flex justify-center">
            <Card className="max-w-md w-full text-center">
                <CardHeader>
                    <div className="mx-auto bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
                        <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-2xl text-red-600 dark:text-red-400">Payment Failed</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-muted-foreground">
                        We couldn't process your payment. This might be due to a cancelled transaction or a gateway error.
                    </p>

                    <div className="flex flex-col gap-3 pt-4">
                        <Button className="w-full" asChild>
                            <Link href="/pricing">
                                <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/dashboard">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
