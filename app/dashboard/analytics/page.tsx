"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    LineChart, Line, XAxis, YAxis, CartesianGrid
} from "recharts";
import { Brain, TrendingUp, Smile, Clock } from "lucide-react";

interface EmotionSession {
    duration: number;
    timestamp: number;
    history: { mood: string; timestamp: number }[];
}

const COLORS = {
    happy: "#4ade80",
    neutral: "#60a5fa",
    surprised: "#facc15",
    sad: "#ef4444",
    angry: "#f97316",
    fearful: "#a855f7",
    disgusted: "#ec4899"
};

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<EmotionSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const historyRef = ref(realtimeDb, `users/${user.uid}/emotionHistory`);
        const unsub = onValue(historyRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.values(data) as EmotionSession[];
                setSessions(list.sort((a, b) => a.timestamp - b.timestamp));
            }
            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    const moodData = useMemo(() => {
        const counts: Record<string, number> = {};
        sessions.forEach(s => {
            s.history.forEach(h => {
                counts[h.mood] = (counts[h.mood] || 0) + 1;
            });
        });

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [sessions]);

    const focusTrendData = useMemo(() => {
        return sessions.map(s => {
            const total = s.history.length;
            const focusMoods = ["neutral", "happy", "surprised"];
            const focusedCount = s.history.filter(h => focusMoods.includes(h.mood)).length;
            const focusScore = total > 0 ? Math.round((focusedCount / total) * 100) : 0;

            return {
                time: new Date(s.timestamp).toLocaleDateString(),
                score: focusScore,
                duration: Math.round(s.duration / 60)
            };
        });
    }, [sessions]);

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-500 dark:text-gray-400">Loading your focus data...</div>;

    if (sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
                <Brain className="w-16 h-16 text-gray-400 dark:text-gray-700 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Analytics Data Yet</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                    Complete your first focus session with the camera turned on to see your emotional productivity breakdown.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-blue-500" />
                        Emotional Analytics
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Deep insights into your focus habits and mood patterns.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Mood Distribution */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Smile className="w-5 h-5 text-green-500" />
                        Emotion Breakdown
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={moodData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {moodData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "#8884d8"} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ textTransform: 'capitalize' }}
                                />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Focus Score trend */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-500" />
                        Focus Quality Trend
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={focusTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" />
                                <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} tickLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} domain={[0, 100]} />
                                <Tooltip 
                                   contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="score" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3} 
                                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Session Logs */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    Recent Sessions
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                                <th className="pb-4 font-semibold">Date</th>
                                <th className="pb-4 font-semibold">Duration</th>
                                <th className="pb-4 font-semibold">Focus Score</th>
                                <th className="pb-4 font-semibold">Primary Mood</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {sessions.slice().reverse().map((s, idx) => {
                                 const total = s.history.length;
                                 const focusMoods = ["neutral", "happy", "surprised"];
                                 const focusedCount = s.history.filter(h => focusMoods.includes(h.mood)).length;
                                 const focusScore = total > 0 ? Math.round((focusedCount / total) * 100) : 0;
                                 const dominantMood = s.history.length > 0 ? s.history.reduce((acc, curr) => {
                                     const counts = s.history.filter(x => x.mood === curr.mood).length;
                                     return counts > s.history.filter(x => x.mood === acc).length ? curr.mood : acc;
                                 }, s.history[0].mood) : "N/A";

                                return (
                                    <tr key={idx} className="text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="py-4 font-medium text-gray-900 dark:text-white">{new Date(s.timestamp).toLocaleDateString()}</td>
                                        <td className="py-4">{Math.round(s.duration / 60)} mins</td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${focusScore}%` }} />
                                                </div>
                                                {focusScore}%
                                            </div>
                                        </td>
                                        <td className="py-4 capitalize">{dominantMood}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
