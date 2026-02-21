"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, set, get, update, increment } from "firebase/database";

interface TimerContextType {
    seconds: number;
    isRunning: boolean;
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    formatTime: (totalSeconds: number) => string;
}

const TimerContext = createContext<TimerContextType>({
    seconds: 0,
    isRunning: false,
    startTimer: () => { },
    pauseTimer: () => { },
    resetTimer: () => { },
    formatTime: () => "00:00:00",
});

const getTodayStr = () => {
    return new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
};

export const TimerProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    // Refs to track state inside intervals/async without stale closures
    const secondsRef = useRef(seconds);
    const lastSyncedSecondsRef = useRef(seconds); // To calculate delta

    // Update ref whenever state changes
    useEffect(() => {
        secondsRef.current = seconds;
    }, [seconds]);

    // 1. Load initial saved time from DB on mount
    useEffect(() => {
        if (!user) return;

        const userStatsRef = ref(realtimeDb, `users/${user.uid}/focusStats/totalSeconds`);

        get(userStatsRef).then((snapshot) => {
            if (snapshot.exists()) {
                const val = snapshot.val();
                setSeconds(val);
                lastSyncedSecondsRef.current = val; // Initialize sync ref
            }
        }).catch(err => console.error("Error fetching stats:", err));
    }, [user]);

    // 2. Timer Interval
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRunning) {
            interval = setInterval(() => {
                setSeconds((prev) => prev + 1);
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isRunning]);

    // 3. Sync to DB logic (shared)
    const syncToDb = async (currentTotal: number) => {
        if (!user) return;

        const delta = currentTotal - lastSyncedSecondsRef.current;
        if (delta <= 0) return; // Nothing to sync

        const today = getTodayStr();
        const updates: any = {};

        // 1. Update Lifetime Total (Overwrite with latest source of truth)
        updates[`users/${user.uid}/focusStats/totalSeconds`] = currentTotal;
        updates[`users/${user.uid}/focusStats/lastUpdated`] = Date.now();

        // 2. Increment Daily Stat (Atomic increment for safety)
        updates[`users/${user.uid}/dailyStats/${today}`] = increment(delta);

        try {
            await update(ref(realtimeDb), updates);
            console.log(`Synced: +${delta}s to ${today}. Total: ${currentTotal}`);
            lastSyncedSecondsRef.current = currentTotal; // Update baseline
        } catch (error) {
            console.error("Sync Error:", error);
        }
    };

    // 4. Periodic Sync
    useEffect(() => {
        if (!user || !isRunning) return;

        const syncInterval = setInterval(() => {
            syncToDb(secondsRef.current);
        }, 5000);

        return () => clearInterval(syncInterval);
    }, [user, isRunning]);

    // 5. Force sync on pause or reset
    const handlePauseOrReset = () => {
        syncToDb(secondsRef.current);
    };

    const startTimer = () => {
        setIsRunning(true);
    };

    const pauseTimer = () => {
        setIsRunning(false);
        handlePauseOrReset();
    };

    const resetTimer = () => {
        // Special logic: sync pending progress, but then reset LOCAL ONLY? 
        // Or do we want to wipe lifetime? Assuming user means "Reset Session".
        // But previously it synced '0' to totalSeconds, effectively wiping lifetime.
        // I will keep the previous behavior of resetting 'seconds' to 0, 
        // BUT I will modify syncToDb to handle a reset scenario if needed.
        // Actually, if we reset to 0, we can't calculate delta correctly against a larger 'lastSynced'.

        handlePauseOrReset(); // First save whatever we have.

        setIsRunning(false);
        setSeconds(0);
        lastSyncedSecondsRef.current = 0; // Reset baseline so we don't send negative delta.

        if (!user) return;

        // If we want to persist the "Reset" (wipe lifetime):
        const userStatsRef = ref(realtimeDb, `users/${user.uid}/focusStats/totalSeconds`);
        set(userStatsRef, 0);
    };

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <TimerContext.Provider value={{ seconds, isRunning, startTimer, pauseTimer, resetTimer, formatTime }}>
            {children}
        </TimerContext.Provider>
    );
};

export const useTimer = () => useContext(TimerContext);
