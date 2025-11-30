import { useState } from 'react';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export function useSubscription() {
    const { isSignedIn } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const subscribe = async (plan: string, amount: number, planType?: string) => {
        if (!isSignedIn) {
            router.push("/sign-in?redirect_url=/");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/payment/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan, amount, planType })
            });

            const data = await res.json();

            if (data.bkashURL && data.paymentID) {
                // Store payment ID in session storage
                sessionStorage.setItem('bkash_payment_id', data.paymentID);

                // Redirect to bKash payment page
                window.location.href = data.bkashURL;
            } else {
                toast.error(data.error || "Failed to initiate payment");
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
            setLoading(false);
        }
    };

    return { subscribe, loading };
}
