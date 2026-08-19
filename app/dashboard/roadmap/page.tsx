"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, onValue, set } from "firebase/database";
import { GitMerge, Sparkles, CheckCircle2, Circle, Clock, ArrowRight, Zap, Trash2, RefreshCcw } from "lucide-react";
import { MindSwal, Toast } from "@/lib/swal";

interface RoadmapStep {
    title: string;
    description: string;
    estimatedTime: string;
    completed?: boolean;
}

export default function RoadmapPage() {
    const { user } = useAuth();
    const [goal, setGoal] = useState("");
    const [steps, setSteps] = useState<RoadmapStep[]>([]);
    const [loading, setLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const roadmapRef = ref(realtimeDb, `users/${user.uid}/currentRoadmap`);
        const unsub = onValue(roadmapRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setSteps(data.steps || []);
                setGoal(data.goal || "");
            }
            setIsInitialLoading(false);
        });
        return () => unsub();
    }, [user]);

    const handleGenerate = async () => {
        if (!goal.trim() || !user) return;
        setLoading(true);

        try {
            const res = await fetch('/api/ai/roadmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to generate roadmap.");
            }

            if (data.phases && data.phases.length > 0) {
                const newSteps = data.phases.map((p: any) => ({ ...p, completed: false }));
                setSteps(newSteps);
                
                // Save to Firebase
                await set(ref(realtimeDb, `users/${user.uid}/currentRoadmap`), {
                    goal,
                    steps: newSteps,
                    updatedAt: Date.now()
                });

                Toast.fire({
                    icon: 'success',
                    title: 'Roadmap generated successfully!'
                });
            } else {
                throw new Error("AI returned an empty roadmap. Please try a more specific goal.");
            }
        } catch (error: any) {
            console.error("Roadmap error:", error);
            MindSwal.fire({
                title: 'Generation Failed',
                text: error.message || "Something went wrong while creating your roadmap.",
                icon: 'error',
                background: '#0f172a',
                color: '#f8fafc',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleStep = async (index: number) => {
        if (!user) return;
        const newSteps = [...steps];
        newSteps[index].completed = !newSteps[index].completed;
        setSteps(newSteps);

        await set(ref(realtimeDb, `users/${user.uid}/currentRoadmap/steps`), newSteps);
    };

    const handleReset = async () => {
        if (!user) return;
        
        const result = await MindSwal.fire({
            title: 'Reset Roadmap?',
            text: "This will permanently delete your current progress and roadmap.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Yes, reset it!',
            background: '#0f172a',
            color: '#f8fafc'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                await set(ref(realtimeDb, `users/${user.uid}/currentRoadmap`), null);
                setSteps([]);
                setGoal("");
                Toast.fire({
                    icon: 'success',
                    title: 'Roadmap cleared.'
                });
            } catch (err) {
                Toast.fire({
                    icon: 'error',
                    title: 'Failed to clear roadmap.'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    if (isInitialLoading) return <div className="p-10 text-center animate-pulse text-gray-400">Loading your roadmap...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <header>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <GitMerge className="w-8 h-8 text-blue-500" />
                            AI Study Roadmap
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Tell us your goal, and we'll map out your path to mastery.</p>
                    </div>
                    {steps.length > 0 && (
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-all text-sm font-bold"
                        >
                            <Trash2 className="w-4 h-4" />
                            Reset Path
                        </button>
                    )}
                </div>
            </header>

            {/* Input Section */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <input 
                        type="text"
                        placeholder="e.g. Master React in 30 days, Learn Python for Data Science..."
                        className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !goal.trim()}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-blue-500/20"
                    >
                        {loading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5" />
                                Generate Roadmap
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Roadmap Steps */}
            {steps.length > 0 && (
                <div className="relative space-y-8 mt-10">
                    {/* Vertical Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-800" />

                    {steps.map((step, idx) => (
                        <div key={idx} className="relative flex gap-6 group">
                            <button 
                                onClick={() => toggleStep(idx)}
                                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${step.completed ? 'bg-green-500 border-green-500 text-white' : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-blue-500'}`}
                            >
                                {step.completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                            </button>

                            <div className={`flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm transition-all ${step.completed ? 'opacity-50 ring-1 ring-green-500/30' : 'hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md'}`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                    <h3 className={`text-lg font-bold ${step.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                                        {step.title}
                                    </h3>
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full w-fit">
                                        <Clock className="h-3 w-3" />
                                        {step.estimatedTime}
                                    </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-center pt-8">
                         <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-center max-w-sm">
                             <Zap className="h-8 w-8 text-blue-500 dark:text-blue-400 mx-auto mb-2" />
                             <h4 className="text-gray-900 dark:text-white font-bold">Stay Consistent!</h4>
                             <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">The difference between a wish and a goal is a plan. You've got the plan, now execute.</p>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
}
