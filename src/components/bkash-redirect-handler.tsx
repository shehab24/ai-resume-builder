"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function BkashRedirectHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const paymentID = searchParams.get("paymentID");
        const status = searchParams.get("status");

        // Only redirect to completion page if payment was successful
        if (paymentID && status === "success") {
            console.log("bKash callback detected, redirecting to completion page");
            router.push(`/payment/bkash?paymentID=${paymentID}`);
        } else if (paymentID && (status === "cancel" || status === "failure")) {
            // For cancelled or failed payments, just stay on current page or redirect to home
            console.log(`Payment ${status}, staying on current page`);
            // Optionally clear the URL parameters
            router.replace(window.location.pathname);
        }
    }, [searchParams, router]);

    return null;
}
