"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("App Runtime Error:", error);
    }, [error]);

    const errorMessage = typeof error === 'string' 
        ? error 
        : error?.message || (typeof error === 'object' ? JSON.stringify(error) : "An unexpected error occurred.");

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] dark:bg-[#0c1017] p-6 text-stone-900 dark:text-stone-100 transition-colors">
            <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl p-8 border border-stone-200 dark:border-stone-800 shadow-2xl text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center shadow-inner">
                    <AlertCircle className="w-8 h-8" />
                </div>

                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">Something went wrong</h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
                        {errorMessage}
                    </p>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={() => reset()}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 dark:bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-stone-800 dark:hover:bg-emerald-500 shadow-md"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Try Again</span>
                    </button>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-200 transition-all hover:bg-stone-100 dark:hover:bg-stone-700"
                    >
                        <Home className="w-4 h-4" />
                        <span>Dashboard</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
