"use client";

import { useState, useEffect } from "react";
import { realtimeDb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { Megaphone, X } from "lucide-react";

export default function BroadcastBanner() {
    const [broadcast, setBroadcast] = useState<{ message: string; timestamp: number } | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    
    useEffect(() => {
        const broadcastRef = ref(realtimeDb, "broadcast/announcement");
        const unsub = onValue(broadcastRef, (snapshot) => {
            const data = snapshot.val();
            // Show broadcast if it exists. If it's a new broadcast (timestamp changes), make it visible again.
            if (data && data.message) {
                setBroadcast(prev => {
                    if (!prev || prev.timestamp !== data.timestamp) {
                        setIsVisible(true);
                    }
                    return data;
                });
            } else {
                setBroadcast(null);
            }
        });
        return () => unsub();
    }, []);

    if (!broadcast || !isVisible) return null;

    return (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-3 flex items-center justify-center shadow-md relative z-50">
            <div className="flex items-center gap-3 mx-auto max-w-4xl w-full">
                <Megaphone className="h-5 w-5 flex-shrink-0 animate-pulse" />
                <span className="text-sm font-semibold flex-1 text-center">{broadcast.message}</span>
            </div>
            <button 
                onClick={() => setIsVisible(false)} 
                className="hover:bg-white/20 p-1.5 rounded-full transition-colors absolute right-4"
                aria-label="Close Announcement"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
