"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, onValue, update, increment, get } from "firebase/database";

interface GamificationContextType {
    xp: number;
    level: number;
    addXp: (amount: number) => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType>({ xp: 0, level: 1, addXp: async () => { } });

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);

    // Load XP from Firebase
    useEffect(() => {
        if (!user) {
            setXp(prev => (prev !== 0 ? 0 : prev));
            setLevel(prev => (prev !== 1 ? 1 : prev));
            return;
        }

        const userRef = ref(realtimeDb, `users/${user.uid}/gamification`);
        const unsubscribe = onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setXp(data.xp || 0);
                setLevel(Math.floor((data.xp || 0) / 100) + 1);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const addXp = async (amount: number) => {
        if (!user) return;
        const userRef = ref(realtimeDb, `users/${user.uid}/gamification`);

        // Also update 'users/{uid}/profile' to ensure name/photo is synced for leaderboard if needed
        // For now, just XP.

        await update(userRef, {
            xp: increment(amount),
            lastUpdated: Date.now()
        });

        // Also update a public 'leaderboard' node for easier querying if we were doing advanced no-sql stuff,
        // but for now iterating users is fine for small scale or we rely on 'users' node structure.
        // Actually, let's keep it simple: just update the user node.
    };

    return (
        <GamificationContext.Provider value={{ xp, level, addXp }}>
            {children}
        </GamificationContext.Provider>
    );
};

export const useGamification = () => useContext(GamificationContext);
