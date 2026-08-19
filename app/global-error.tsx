"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global Runtime Error:", error);
    }, [error]);

    const errorMessage = typeof error === 'string' 
        ? error 
        : error?.message || (typeof error === 'object' ? JSON.stringify(error) : "An unexpected error occurred.");

    return (
        <html lang="en">
            <body className="min-h-screen flex items-center justify-center bg-[#faf8f5] text-stone-900 font-sans p-6">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200 shadow-2xl text-center space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center shadow-inner">
                        <AlertCircle className="w-8 h-8" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-stone-900">Application Error</h2>
                        <p className="text-xs text-stone-500 mt-2">
                            {errorMessage}
                        </p>
                    </div>

                    <button
                        onClick={() => reset()}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-stone-800 shadow-md"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Try Again</span>
                    </button>
                </div>
            </body>
        </html>
    );
}
