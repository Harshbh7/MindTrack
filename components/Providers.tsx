"use client";

import { AuthProvider } from "@/context/AuthContext";
import { TimerProvider } from "@/context/TimerContext";
import { GamificationProvider } from "@/context/GamificationContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <GamificationProvider>
                <TimerProvider>
                    {children}
                </TimerProvider>
            </GamificationProvider>
        </AuthProvider>
    );
}
