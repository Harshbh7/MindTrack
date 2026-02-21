"use client";

import { useMemo } from "react";
import { X, Share2, Award, Zap, Brain } from "lucide-react";

interface MoodEntry {
    timestamp: number;
    mood: string;
}

interface SessionReportProps {
    duration: number; // in seconds
    moodHistory: MoodEntry[];
    onClose: () => void;
}

export default function SessionReport({ duration, moodHistory, onClose }: SessionReportProps) {
    const stats = useMemo(() => {
        if (moodHistory.length === 0) return null;

        const total = moodHistory.length;
        const moodCounts: Record<string, number> = {};

        moodHistory.forEach(entry => {
            moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        });

        const focusMoods = ["neutral", "happy", "surprised"];
        const distractedMoods = ["sad", "angry", "disgusted", "fearful"];

        let focusCount = 0;
        let stressCount = 0;

        Object.entries(moodCounts).forEach(([mood, count]) => {
            if (focusMoods.includes(mood)) focusCount += count;
            if (distractedMoods.includes(mood)) stressCount += count;
        });

        const focusScore = Math.round((focusCount / total) * 100);
        const stressLevel = Math.round((stressCount / total) * 100);

        // Generate Tip
        let tip = "Great job! Your focus was steady.";
        if (focusScore < 50) tip = "You seemed distracted. Try shorter 25m sessions.";
        if (stressLevel > 30) tip = "High stress detected. Remember to breathe and hydrate!";
        if (duration > 3600 && focusScore > 80) tip = "Amazing endurance! You're in flow state.";

        return {
            focusScore,
            stressLevel,
            dominantMood: Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b),
            tip
        };
    }, [moodHistory, duration]);

    if (!stats) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-gray-900 border border-purple-500/30 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>

                <div className="p-6 relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Brain className="w-6 h-6 text-purple-400" />
                                Session AI Analysis
                            </h2>
                            <p className="text-gray-400 text-sm">Here's how you performed.</p>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 text-center">
                            <div className="text-3xl font-bold text-green-400 mb-1">{stats.focusScore}%</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Focus Score</div>
                        </div>
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 text-center">
                            <div className="text-3xl font-bold text-orange-400 mb-1">{Math.floor(duration / 60)}m</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Duration</div>
                        </div>
                    </div>

                    <div className="bg-gray-800/80 rounded-xl p-5 mb-6 border border-gray-700">
                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            AI Insight
                        </h4>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            "{stats.tip}"
                        </p>
                        <div className="mt-3 text-xs text-gray-500">
                            Dominant Mood: <span className="text-white capitalize">{stats.dominantMood}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                        <button className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
