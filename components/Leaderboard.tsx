"use client";

import { useEffect, useState } from "react";
import { realtimeDb } from "@/lib/firebase";
import { ref, query, orderByChild, limitToLast, onValue } from "firebase/database";
import { Trophy, Crown, Medal } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type LeaderboardUser = {
    uid: string;
    xp: number;
    name?: string; // We might not have names saved in RTDB yet, so fallback to 'Anonymous'
};

export default function Leaderboard() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<LeaderboardUser[]>([]);

    useEffect(() => {
        // Fetch users. 
        // Note: Our DB structure is users/{uid}/gamification/xp. 
        // Sorting by deep path in generic 'onValue' of 'users' is easiest for MVP with small data.
        // Proper way: Store a separate 'leaderboard' node strictly for this.

        const usersRef = ref(realtimeDb, "users");
        // For MVP: Fetch all and sort client side (assuming < 100 users for demo)

        const unsubscribe = onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            const parsedUsers: LeaderboardUser[] = Object.entries(data).map(([uid, val]: [string, any]) => ({
                uid,
                xp: val.gamification?.xp || 0,
                name: val.profile?.displayName || `User ${uid.slice(0, 4)}`
            }));

            // Sort Descending
            parsedUsers.sort((a, b) => b.xp - a.xp);
            setUsers(parsedUsers.slice(0, 5)); // Top 5
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="bg-white dark:bg-gradient-to-br dark:from-yellow-900/20 dark:to-gray-900 border border-yellow-200 dark:border-yellow-700/30 shadow-sm rounded-2xl p-6 relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Trophy className="w-24 h-24 text-yellow-500" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                Leaderboard
            </h3>

            <div className="space-y-3">
                {users.map((user, index) => {
                    const isMe = user.uid === currentUser?.uid;
                    let RankIcon = null;
                    if (index === 0) RankIcon = <Crown className="w-4 h-4 text-yellow-400" />;
                    else if (index === 1) RankIcon = <Medal className="w-4 h-4 text-gray-300" />;
                    else if (index === 2) RankIcon = <Medal className="w-4 h-4 text-amber-700" />;

                    return (
                        <div
                            key={user.uid}
                            className={`flex items-center justify-between p-3 rounded-xl border ${isMe ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/50' : 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-black' :
                                    index === 1 ? 'bg-gray-300 text-black' :
                                        index === 2 ? 'bg-amber-700 text-white' :
                                            'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <p className={`font-semibold text-sm ${isMe ? 'text-yellow-600 dark:text-yellow-200' : 'text-gray-900 dark:text-gray-200'}`}>
                                        {user.name || "Anonymous"}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Level {Math.floor(user.xp / 100) + 1}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-mono font-bold text-yellow-600 dark:text-yellow-500">{user.xp} XP</p>
                            </div>
                        </div>
                    );
                })}

                {users.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No champions yet. Be the first!</p>
                )}
            </div>
        </div>
    );
}
