"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Suspense } from "react";

function BkashPaymentContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [paymentID, setPaymentID] = useState("");
    const [loading, setLoading] = useState(false);
    const [autoExecuted, setAutoExecuted] = useState(false);

    useEffect(() => {
        // Get paymentID from URL if present
        const urlPaymentID = searchParams.get("paymentID");
        if (urlPaymentID) {
            setPaymentID(urlPaymentID);

            // Auto-execute payment if coming from bKash
            if (!autoExecuted) {
                setAutoExecuted(true);
                executePayment(urlPaymentID);
            }
        }
    }, [searchParams, autoExecuted]);

    const executePayment = async (pid: string) => {
        if (!pid) {
            toast.error("Please enter Payment ID");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/payment/bkash/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentID: pid })
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Payment completed successfully!");
                router.push("/payment/success");
            } else {
                toast.error(data.error || "Payment failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-20 px-4 flex justify-center">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Complete bKash Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            After completing payment on bKash, enter your Payment ID below to finalize your subscription.
                        </p>
                        <p className="text-sm text-muted-foreground font-medium">
                            You can find the Payment ID in the bKash payment confirmation.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Payment ID</label>
                            <Input
                                type="text"
                                placeholder="Enter Payment ID"
                                value={paymentID}
                                onChange={(e) => setPaymentID(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        <Button
                            className="w-full"
                            onClick={() => executePayment(paymentID)}
                            disabled={loading || !paymentID}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Complete Payment
                        </Button>
                    </div>

                    <div className="pt-4 border-t">
                        <p className="text-xs text-muted-foreground text-center">
                            Having trouble? Contact support for assistance.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function BkashPaymentPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <BkashPaymentContent />
        </Suspense>
    );
}
