'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { acceptTripInvite } from '../../actions/invites';
import { useAuth } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

export default function InvitePage({ params }) {
    const { token } = use(params);
    const router = useRouter();
    const { isLoaded, userId } = useAuth();
    const [status, setStatus] = useState('processing');
    const [errorMsg, setErrorMsg] = useState(null);
    const hasAttempted = useRef(false);

    useEffect(() => {
        if (!isLoaded) return; // Wait for clerk to load

        // If not logged in, clerk's middleware should ideally redirect, but we can handle it
        if (!userId) {
            const currentUrl = encodeURIComponent(window.location.pathname);
            router.push(`/sign-in?redirect_url=${currentUrl}`);
            return;
        }

        if (hasAttempted.current) return;
        hasAttempted.current = true;

        const handleInvite = async () => {
            try {
                const res = await acceptTripInvite(token);
                if (res.success) {
                    setStatus('success');
                    // Add a small delay for better UX before redirecting
                    setTimeout(() => {
                        router.push(`/ai-planner?tripId=${res.tripId}`);
                    }, 1500);
                }
            } catch (err) {
                console.error("Invite error:", err);
                setStatus('error');
                setErrorMsg(err.message || 'Failed to accept the invite.');
            }
        };

        handleInvite();
    }, [isLoaded, userId, token, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                {status === 'processing' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="h-10 w-10 text-[#FF6B2C] animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-gray-800">Processing Invite...</h2>
                        <p className="text-gray-500 mt-2">Please wait while we add you to the trip.</p>
                    </div>
                )}
                
                {status === 'success' && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Invite Accepted!</h2>
                        <p className="text-gray-500 mt-2">Redirecting you to the trip planner...</p>
                    </div>
                )}
                
                {status === 'error' && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Oops!</h2>
                        <p className="text-red-500 mt-2">{errorMsg}</p>
                        <button 
                            onClick={() => router.push('/')}
                            className="mt-6 px-4 py-2 bg-[#FF6B2C] text-white rounded-lg hover:bg-[#e55e24] transition-colors"
                        >
                            Go Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
