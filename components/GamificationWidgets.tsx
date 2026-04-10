"use client";

import { useState, useEffect } from "react";
import { Crown, Trophy, Zap, Gamepad2, Gift, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, onValue, set, update, get } from "firebase/database";

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

const BADGES = [
    { id: "b1", name: "Novice Focus", threshold: 60 * 60, icon: "🥉" },
    { id: "b2", name: "Deep Thinker", threshold: 5 * 60 * 60, icon: "🥈" },
    { id: "b3", name: "Code Ninja", threshold: 10 * 60 * 60, icon: "🥇" },
    { id: "b4", name: "Zen Master", threshold: 50 * 60 * 60, icon: "💎" },
    { id: "b5", name: "7-Day Streak", threshold: 7 * 24 * 60 * 60, icon: "🔥", special: "streak" },
    { id: "b6", name: "Night Owl", threshold: 0, icon: "🦉", special: "time" },
];

const SKINS = [
    { id: "pixel", name: "Pixel (Default)", emoji: "👾", color: "from-indigo-500 to-purple-600" },
    { id: "cyber", name: "Cyberpunk", emoji: "🤖", color: "from-cyan-400 to-blue-600" },
    { id: "void", name: "The Void", emoji: "⬛", color: "from-gray-900 to-black" },
    { id: "zen", name: "Zen Master", emoji: "🧘", color: "from-green-400 to-emerald-600" },
];

export default function GamificationWidgets() {
    const { user } = useAuth();
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(5);
    const [globalQuests, setGlobalQuests] = useState<Quest[]>([]);
    const [completedQuests, setCompletedQuests] = useState<Record<string, boolean>>({});
    
    // Gamification specific
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
    const [currentSkin, setCurrentSkin] = useState(SKINS[0]);
    const [isCustomizing, setIsCustomizing] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Listen to Global Quests
        const globalQuestsRef = ref(realtimeDb, "globalQuests");
        const unsubGQ = onValue(globalQuestsRef, (snap) => {
            const data = snap.val();
            if (data) {
                const list = Object.entries(data).map(([key, val]: [string, any]) => ({
                    id: key,
                    text: val.text,
                    completed: false // default, overridden by completedQuests lookup
                }));
                setGlobalQuests(list);
            } else {
                setGlobalQuests([]);
            }
        });

        // Listen to User Gamification Data
        const gamificationRef = ref(realtimeDb, `users/${user.uid}/gamification`);
        const unsubUser = onValue(gamificationRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setXp(data.xp || 0);
                setLevel(data.level || 5);
                setCompletedQuests(data.completedQuests || {});
                if (data.skinId) {
                    const skin = SKINS.find(s => s.id === data.skinId);
                    if (skin) setCurrentSkin(skin);
                }
            } else {
                set(gamificationRef, { xp: 0, level: 5, completedQuests: {}, skinId: 'pixel' });
            }
        });

        const statsRef = ref(realtimeDb, `users/${user.uid}/focusStats/totalSeconds`);
        const unsubStats = onValue(statsRef, (snap) => setTotalSeconds(snap.val() || 0));

        return () => {
             unsubGQ();
             unsubUser();
             unsubStats();
        };
    }, [user]);

    // Check unlocks
    useEffect(() => {
        if (!user) return;
        
        const earned = BADGES.filter(b => totalSeconds >= b.threshold).map(b => b.id);
        
        const badgesRef = ref(realtimeDb, `users/${user.uid}/gamification/badges`);
        get(badgesRef).then(snap => {
            const dbBadges = snap.val() || [];
            
            const newlyEarned = earned.filter(id => !dbBadges.includes(id));
            if (newlyEarned.length > 0) {
                 const newBadgeList = [...dbBadges, ...newlyEarned];
                 set(badgesRef, newBadgeList);
                 
                 newlyEarned.forEach(id => {
                     const b = BADGES.find(x => x.id === id);
                     if (typeof window !== 'undefined') {
                         // Simple toast simulation
                         alert(`🏆 Unlocked Achievement: ${b?.name}!`);
                     }
                 });
            }
            setUnlockedBadges(earned);
        });
    }, [totalSeconds, user]);

    const toggleQuest = (questId: string) => {
        if (!user) return;
        const currentStatus = !!completedQuests[questId];
        update(ref(realtimeDb, `users/${user.uid}/gamification/completedQuests`), {
            [questId]: !currentStatus
        });
    };

    // Calculate progress to next level (assuming 100 XP per level)
    const xpForNextLevel = 100;
    const currentLevelXp = xp % xpForNextLevel;
    const progressPercentage = Math.min(100, Math.round((currentLevelXp / xpForNextLevel) * 100));

    // Dynamic level based on total XP (every 100 XP is a level up, starting from level 5 base)
    const calculatedLevel = level + Math.floor(xp / xpForNextLevel);

    const completedCount = Object.keys(completedQuests).filter(id => completedQuests[id] && globalQuests.some(q => q.id === id)).length;

    return (
        <div className="grid gap-6">
            {/* Character / Pet Widget */}
            <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 backdrop-blur-sm shadow-sm transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Gamepad2 className="h-32 w-32" />
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Your Companion</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Level {calculatedLevel} • &quot;{currentSkin.name}&quot;</p>

                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                            </div>
                            <span className="text-[10px] text-green-500 dark:text-green-400">{progressPercentage}% to Lvl {calculatedLevel + 1}</span>
                        </div>

                        <button 
                            onClick={() => setIsCustomizing(true)}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-700 dark:text-white transition-colors"
                        >
                            Customize Skin
                        </button>
                    </div>

                    {/* Dynamic Pet Skin */}
                    <div className={`h-20 w-20 rounded-full bg-gradient-to-br ${currentSkin.color} p-1 animate-pulse shadow-lg flex items-center justify-center transition-all duration-500`}>
                        <div className="text-4xl">{currentSkin.emoji}</div>
                    </div>
                </div>

                {/* Customization Modal Overlay */}
                {isCustomizing && (
                    <div className="absolute inset-0 z-20 bg-gray-900/95 backdrop-blur-sm animate-in fade-in flex flex-col p-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-white">Select Companion Skin</span>
                            <button onClick={() => setIsCustomizing(false)} className="text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 overflow-y-auto">
                            {SKINS.map(skin => (
                                <button 
                                    key={skin.id}
                                    onClick={async () => {
                                        setCurrentSkin(skin);
                                        if (user) {
                                            await update(ref(realtimeDb, `users/${user.uid}/gamification`), { skinId: skin.id });
                                        }
                                        setIsCustomizing(false);
                                    }}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${currentSkin.id === skin.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'}`}
                                >
                                    <span className="text-2xl">{skin.emoji}</span>
                                    <span className="text-[10px] text-white font-medium">{skin.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Battle / Competition */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 backdrop-blur-sm shadow-sm transition-colors">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-500">
                        <Crown className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Focus Battle</h3>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">You vs. Sarah</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Ends in 2h</span>
                    </div>

                    <div className="space-y-3">
                        {/* You */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">You</span>
                                <span className="text-gray-900 dark:text-white">2h 15m</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[65%]" />
                            </div>
                        </div>

                        {/* Opponent */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-red-600 dark:text-red-400 font-bold">Sarah</span>
                                <span className="text-gray-900 dark:text-white">1h 45m</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 w-[45%]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Quest */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-indigo-900/20 p-6 backdrop-blur-sm shadow-sm transition-colors">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-500">
                        <Gift className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Daily Quests</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{completedCount}/{globalQuests.length} Completed</p>
                    </div>
                </div>

                <ul className="space-y-2">
                    {globalQuests.map((quest) => {
                        const isCompleted = !!completedQuests[quest.id];
                        return (
                            <li key={quest.id} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 group cursor-pointer" onClick={() => toggleQuest(quest.id)}>
                                <div className={`h-4 w-4 rounded-full flex items-center justify-center transition-colors ${isCompleted ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-500' : 'border border-gray-300 dark:border-gray-600 group-hover:border-indigo-400'}`}>
                                    {isCompleted && '✓'}
                                </div>
                                <span className={isCompleted ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-700 dark:text-gray-300"}>{quest.text}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
            {/* Badges / Achievements */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 backdrop-blur-sm shadow-sm transition-colors">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-500">
                        <Trophy className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Achievements</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {BADGES.map(badge => {
                        const isUnlocked = unlockedBadges.includes(badge.id);
                        return (
                            <div key={badge.id} className={`flex flex-col items-center p-3 rounded-lg border transition-all ${isUnlocked ? 'border-orange-500/50 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 opacity-50 grayscale'}`}>
                                <span className={`text-3xl mb-2 ${isUnlocked ? 'animate-bounce' : ''}`}>{badge.icon}</span>
                                <span className="text-[10px] font-bold text-center text-gray-900 dark:text-white">{badge.name}</span>
                                <span className="text-[8px] text-gray-500 text-center mt-1">{(badge.threshold / 3600).toFixed(0)}h Focus</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
