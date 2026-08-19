"use client";

import { useEffect, useState } from "react";
import { realtimeDb } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { Trophy, Clock, Medal } from "lucide-react";

interface LeaderboardEntry {
    uid: string;
    name: string;
    totalSeconds: number;
}

export default function LeaderboardPage() {
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaders = async () => {
            try {
                // Fetch both stats and user profiles from Realtime DB
                // 1. users: contains focusStats
                // 2. allUsers: contains profile info (name, email)

                const usersRef = ref(realtimeDb, "users");
                const allUsersRef = ref(realtimeDb, "allUsers");

                // Fetch both snapshots
                const [statsSnapshot, profilesSnapshot] = await Promise.all([
                    get(usersRef),
                    get(allUsersRef)
                ]);

                if (statsSnapshot.exists()) {
                    const statsData = statsSnapshot.val();
                    const profilesData = profilesSnapshot.exists() ? profilesSnapshot.val() : {};

                    const entries: LeaderboardEntry[] = [];

                    Object.entries(statsData).forEach(([uid, val]: [string, any]) => {
                        if (val.focusStats && val.focusStats.totalSeconds) {
                            // Extract name with a robust multi-fallback hierarchy
                            let profileName =
                                profilesData[uid]?.name ||
                                profilesData[uid]?.displayName ||
                                val?.profile?.displayName ||
                                val?.name;

                            if (!profileName) {
                                const email = profilesData[uid]?.email || val?.email || val?.profile?.email;
                                if (email && email.includes("@")) {
                                    profileName = email.split("@")[0];
                                }
                            }

                            if (!profileName) {
                                profileName = `Student-${uid.substring(0, 4)}`;
                            }

                            entries.push({
                                uid,
                                name: profileName,
                                totalSeconds: val.focusStats.totalSeconds
                            });
                        }
                    });

                    // Sort by totalSeconds desc
                    entries.sort((a, b) => b.totalSeconds - a.totalSeconds);
                    setLeaders(entries);
                }
                setLoading(false);

            } catch (error) {
                console.error("Error fetching leaderboard:", error);
                setLoading(false);
            }
        };

        fetchLeaders();
    }, []);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] flex-col gap-6">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition-colors">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Trophy className="mr-3 h-6 w-6 text-yellow-500" />
                        Leaderboard
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Top students by focus time</p>
                </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition-colors">
                {loading ? (
                    <div className="text-center text-gray-500 py-20">Loading rankings...</div>
                ) : leaders.length === 0 ? (
                    <div className="text-center text-gray-500 py-20">No active students yet. Start studying!</div>
                ) : (
                    <div className="space-y-4">
                        {leaders.map((leader, index) => (
                            <div key={leader.uid} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 hover:border-purple-500/50 shadow-sm transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold 
                                        ${index === 0 ? 'bg-yellow-500 text-black' :
                                            index === 1 ? 'bg-gray-400 text-black' :
                                                index === 2 ? 'bg-orange-600 text-white' :
                                                    'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-400'}`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{leader.name}</p>
                                        <p className="text-xs text-gray-500">Rank {index + 1}</p>
                                    </div>
                                </div>
                                <div className="flex items-center text-blue-600 dark:text-blue-400 font-mono font-medium">
                                    <Clock className="mr-2 h-4 w-4" />
                                    {formatTime(leader.totalSeconds)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
