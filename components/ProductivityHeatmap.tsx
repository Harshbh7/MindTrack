"use client";

import { Flame } from "lucide-react";



// Mock data generation for the "calendar" style view - just a simplified version for now
// In a real app we'd use a dedicated calendar heatmap library or complex grid
const MOCKED_DAYS = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
        day: d.toLocaleDateString("en-US", { weekday: "narrow" }),
        date: d.toISOString().split("T")[0],
        level: Math.floor(Math.random() * 4), // 0-4 intensity
    };
});

const INTENSITY_COLORS = {
    0: "bg-gray-100 dark:bg-gray-800",
    1: "bg-indigo-200 dark:bg-indigo-900/40",
    2: "bg-indigo-300 dark:bg-indigo-700/60",
    3: "bg-indigo-400 dark:bg-indigo-500",
    4: "bg-indigo-600 dark:bg-indigo-300",
};

export default function ProductivityHeatmap() {
    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 backdrop-blur-sm shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                        <Flame className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Focus Streak</h3>
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">12 Day Streak! 🔥</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">42.5h</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Focus this month</p>
                </div>
            </div>

            {/* GitHub-style Heatmap (Simplistic Last 2 Weeks) */}
            <div className="mb-4">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Last 14 Days</span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {MOCKED_DAYS.map((day, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                            <div
                                className={`h-8 w-full rounded-md transition-all hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900 ${INTENSITY_COLORS[day.level as keyof typeof INTENSITY_COLORS]}`}
                                title={`${day.date}: Level ${day.level}`}
                            />
                            <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">{day.day}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between mt-4 py-3 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Less</span>
                    <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map(l => (
                            <div key={l} className={`h-3 w-3 rounded-sm ${INTENSITY_COLORS[l as keyof typeof INTENSITY_COLORS]}`} />
                        ))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">More</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    Best Focus: <span className="text-gray-900 dark:text-white font-medium">8 PM - 11 PM</span>
                </div>
            </div>
        </div>
    );
}
