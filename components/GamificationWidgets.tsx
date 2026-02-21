"use client";

import { useState, useEffect } from "react";
import { Crown, Trophy, Zap, Gamepad2, Gift } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, onValue, set, update } from "firebase/database";

interface Quest {
    id: string;
    text: string;
    completed: boolean;
}

const DEFAULT_QUESTS: Quest[] = [
    { id: "1", text: "Focus for 1 hour", completed: false },
    { id: "2", text: "Complete 1 Math task", completed: false },
    { id: "3", text: "Win a Focus Battle", completed: false }
];

export default function GamificationWidgets() {
    const { user } = useAuth();
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(5);
    const [quests, setQuests] = useState<Quest[]>([]);

    useEffect(() => {
        if (!user) return;
        const gamificationRef = ref(realtimeDb, `users/${user.uid}/gamification`);
        const unsub = onValue(gamificationRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setXp(data.xp || 0);
                setLevel(data.level || 5);
                setQuests(data.quests || DEFAULT_QUESTS);
            } else {
                // Initialize defaults
                set(gamificationRef, { xp: 0, level: 5, quests: DEFAULT_QUESTS });
            }
        });

        return () => unsub();
    }, [user]);

    const toggleQuest = (id: string) => {
        if (!user) return;
        const index = quests.findIndex(q => q.id === id);
        if (index !== -1) {
            const currentStatus = quests[index].completed;
            update(ref(realtimeDb, `users/${user.uid}/gamification/quests/${index}`), {
                completed: !currentStatus
            });
        }
    };

    // Calculate progress to next level (assuming 100 XP per level)
    const xpForNextLevel = 100;
    const currentLevelXp = xp % xpForNextLevel;
    const progressPercentage = Math.min(100, Math.round((currentLevelXp / xpForNextLevel) * 100));

    // Dynamic level based on total XP (every 100 XP is a level up, starting from level 5 base)
    const calculatedLevel = level + Math.floor(xp / xpForNextLevel);

    const completedCount = quests.filter(q => q.completed).length;

    return (
        <div className="grid gap-6">
            {/* Character / Pet Widget */}
            <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Gamepad2 className="h-32 w-32" />
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Your Companion</h3>
                        <p className="text-xs text-gray-400 mb-4">Level {calculatedLevel} • &quot;Pixel&quot;</p>

                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-24 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                            </div>
                            <span className="text-[10px] text-green-400">{progressPercentage}% to Lvl {calculatedLevel + 1}</span>
                        </div>

                        <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-white transition-colors">
                            Customize
                        </button>
                    </div>

                    {/* Simple CSS-only "Pet" Placeholder or SVG */}
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-1 animate-pulse shadow-lg shadow-purple-500/20 flex items-center justify-center">
                        <div className="text-4xl">👾</div>
                    </div>
                </div>
            </div>

            {/* Battle / Competition */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                        <Crown className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Focus Battle</h3>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-white">You vs. Sarah</span>
                        <span className="text-xs text-gray-400">Ends in 2h</span>
                    </div>

                    <div className="space-y-3">
                        {/* You */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-indigo-400 font-bold">You</span>
                                <span className="text-white">2h 15m</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[65%]" />
                            </div>
                        </div>

                        {/* Opponent */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-red-400 font-bold">Sarah</span>
                                <span className="text-white">1h 45m</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 w-[45%]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Quest */}
            <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900 to-indigo-900/20 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                        <Gift className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Daily Quests</h3>
                        <p className="text-xs text-gray-400">{completedCount}/{quests.length} Completed</p>
                    </div>
                </div>

                <ul className="space-y-2">
                    {quests.map(quest => (
                        <li key={quest.id} className="flex items-center gap-2 text-xs text-gray-300 group cursor-pointer" onClick={() => toggleQuest(quest.id)}>
                            <div className={`h-4 w-4 rounded-full flex items-center justify-center transition-colors ${quest.completed ? 'bg-green-500/20 text-green-500' : 'border border-gray-600 group-hover:border-indigo-400'}`}>
                                {quest.completed && '✓'}
                            </div>
                            <span className={quest.completed ? "text-gray-500 line-through" : "text-gray-300"}>{quest.text}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
