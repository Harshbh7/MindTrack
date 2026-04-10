"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import {
    Activity,
    Clock,
    Calendar,
    Zap,
    Trophy,
    Play
} from "lucide-react";
import Link from "next/link";
import {
    ResponsiveContainer,
    BarChart as RechartsBarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip
} from "recharts";

// Components
import Leaderboard from "@/components/Leaderboard";
import AIStudyPlan from "@/components/AIStudyPlan";
import ProductivityHeatmap from "@/components/ProductivityHeatmap";
import GamificationWidgets from "@/components/GamificationWidgets";
import FocusBattle from "@/components/FocusBattle";
import TodoWidget from "@/components/TodoWidget";
import StudyGoals from "@/components/StudyGoals";

interface DailyStat {
    name: string;
    seconds: number;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        todaySeconds: 0,
        monthSeconds: 0,
        lifetimeSeconds: 0,
        activeStreak: 0,
        tasksCompleted: 0
    });
    const [chartData, setChartData] = useState<DailyStat[]>([]);
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(true);

    const getTodayStr = () => new Date().toISOString().split('T')[0];
    const getMonthPrefix = () => new Date().toISOString().slice(0, 7); // "YYYY-MM"

    // Helper for "10h 30m"
    const formatTimeDetailed = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    useEffect(() => {
        if (!user) return;

        // 1. Fetch User Name
        const nameRef = ref(realtimeDb, `allUsers/${user.uid}/name`);
        const nameUnsub = onValue(nameRef, (snapshot) => {
            const name = snapshot.val();
            setDisplayName(name || user.displayName || "Scholar");
        });

        // 2. Fetch Stats (Lifetime & Daily)
        const userRef = ref(realtimeDb, `users/${user.uid}`);
        const statsUnsub = onValue(userRef, (snapshot) => {
            const data = snapshot.val();

            if (data) {
                const lifetime = data.focusStats?.totalSeconds || 0;
                const dailyStats = data.dailyStats || {};

                const todayStr = getTodayStr();
                const monthPrefix = getMonthPrefix();

                let todaySum = 0;
                let monthSum = 0;
                const chartHistory: DailyStat[] = [];

                // Calculate Totals & Chart Data
                Object.entries(dailyStats).forEach(([date, seconds]: [string, any]) => {
                    const sec = Number(seconds);

                    // Today
                    if (date === todayStr) {
                        todaySum = sec;
                    }

                    // Month
                    if (date.startsWith(monthPrefix)) {
                        monthSum += sec;
                    }

                    // For Chart: Last 7 days? Or just all dates?
                    // Let's sort and take last 7 for now
                    chartHistory.push({
                        name: date.slice(5), // "MM-DD"
                        seconds: sec
                    });
                });

                // Sort chart data by date
                chartHistory.sort((a, b) => a.name.localeCompare(b.name));
                const recentChart = chartHistory.slice(-7); // Last 7 entries

                setStats(prev => ({
                    ...prev,
                    lifetimeSeconds: lifetime,
                    todaySeconds: todaySum,
                    monthSeconds: monthSum
                }));
                setChartData(recentChart);
            }
            setLoading(false);
        });

        return () => {
            nameUnsub();
            statsUnsub();
        };
    }, [user]);

    if (loading) {
        return <div className="text-center text-gray-500 py-20">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-600">{displayName}</span>! 👋
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">Time to unlock your full potential.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/learning" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center shadow-lg shadow-purple-500/20">
                        <Play className="h-4 w-4 mr-2" /> Start Focus
                    </Link>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Lifetime Card */}
                <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 backdrop-blur-sm hover:border-purple-500/30 transition-colors group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Trophy className="h-24 w-24 text-purple-500" />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Lifetime Focus</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatTimeDetailed(stats.lifetimeSeconds)}</p>
                    <p className="text-xs text-purple-400 mt-2 flex items-center">
                        Total focus journey
                    </p>
                </div>

                {/* Today Card */}
                <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 backdrop-blur-sm hover:border-green-500/30 transition-colors group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap className="h-24 w-24 text-green-500" />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                            <Zap className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Focused Today</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatTimeDetailed(stats.todaySeconds)}</p>
                    <p className="text-xs text-green-400 mt-2 flex items-center">
                        <Activity className="h-3 w-3 mr-1" /> Active today
                    </p>
                </div>

                {/* Monthly Card */}
                <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 backdrop-blur-sm hover:border-blue-500/30 transition-colors group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar className="h-24 w-24 text-blue-500" />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">This Month</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatTimeDetailed(stats.monthSeconds)}</p>
                    <p className="text-xs text-gray-500 mt-2">
                        Monthly Cumulative
                    </p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">

                {/* Left Column (2/3 width) - Charts & AI Tools */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Productivity Heatmap */}
                    <ProductivityHeatmap />

                    {/* Activity Chart */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
                        <div className="h-[300px] w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <RechartsBarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                        <XAxis dataKey="name" stroke="#6b7280" axisLine={false} tickLine={false} />
                                        <YAxis stroke="#6b7280" axisLine={false} tickLine={false} tickFormatter={(val) => `${(val / 60).toFixed(0)}m`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
                                            cursor={{ fill: '#1f2937', opacity: 0.4 }}
                                            formatter={(value: number | undefined) => [value ? `${(value / 60).toFixed(1)} mins` : "0 mins", "Focus Time"]}
                                        />
                                        <Bar dataKey="seconds" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">
                                    No activity recorded yet. Start a session!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI Study Plan */}
                    <AIStudyPlan />
                </div>

                {/* Right Column (1/3 width) - Gamification & Social */}
                <div className="space-y-6">

                    {/* Gamification Widgets (Pet, Level, Quests) */}
                    <GamificationWidgets />

                    {/* Todo Widget */}
                    <TodoWidget />

                    {/* Study Goals Widget */}
                    <StudyGoals />

                    {/* Battle Mode */}
                    <div className="mt-6 md:col-span-3">
                        <FocusBattle />
                    </div>

                    {/* Leaderboard */}
                    <Leaderboard />

                    {/* Daily Quote */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl p-6 transition-colors">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-200 mb-4">Daily Quote</h3>
                        <blockquote className="italic text-gray-600 dark:text-gray-400 leading-relaxed">
                            "Focus is the key to productivity. Let MindTrack help you achieve your goals."
                        </blockquote>
                    </div>
                </div>
            </div>
        </div>
    );
}

