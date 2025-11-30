import { useEffect, useState } from 'react';

export interface Subscription {
    id: string;
    plan: string;
    status: string;
    endDate: Date;
}

export function useSubscription() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                const res = await fetch('/api/user/subscription');
                if (res.ok) {
                    const data = await res.json();
                    setSubscription(data.subscription);
                }
            } catch (error) {
                console.error('Error fetching subscription:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, []);

    const isPro = subscription?.status === 'ACTIVE' && subscription?.plan === 'PRO';
    const isFree = !isPro;

    return {
        subscription,
        loading,
        isPro,
        isFree,
    };
}
