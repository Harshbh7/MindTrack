"use client";

import { AuthProvider } from "@/context/AuthContext";
import { TimerProvider } from "@/context/TimerContext";
import { GamificationProvider } from "@/context/GamificationContext";

import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="mindtrack-theme" disableTransitionOnChange>
            <AuthProvider>
                <GamificationProvider>
                    <TimerProvider>
                        {children}
                    </TimerProvider>
                </GamificationProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
