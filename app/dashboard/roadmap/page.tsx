"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, onValue, set } from "firebase/database";
import { GitMerge, Sparkles, CheckCircle2, Circle, Clock, ArrowRight, Zap } from "lucide-react";

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
            if (data.phases) {
                const newSteps = data.phases.map((p: any) => ({ ...p, completed: false }));
                setSteps(newSteps);
                
                // Save to Firebase
                await set(ref(realtimeDb, `users/${user.uid}/currentRoadmap`), {
                    goal,
                    steps: newSteps,
                    updatedAt: Date.now()
                });
            }
        } catch (error) {
            console.error("Roadmap error:", error);
            alert("Failed to generate roadmap.");
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

    if (isInitialLoading) return <div className="p-10 text-center animate-pulse text-gray-400">Loading your roadmap...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <header>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <GitMerge className="w-8 h-8 text-blue-400" />
                    AI Study Roadmap
                </h1>
                <p className="text-gray-400 mt-1">Tell us your goal, and we'll map out your path to mastery.</p>
            </header>

            {/* Input Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col md:flex-row gap-4">
                    <input 
                        type="text"
                        placeholder="e.g. Master React in 30 days, Learn Python for Data Science..."
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !goal.trim()}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-800" />

                    {steps.map((step, idx) => (
                        <div key={idx} className="relative flex gap-6 group">
                            <button 
                                onClick={() => toggleStep(idx)}
                                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${step.completed ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-blue-500'}`}
                            >
                                {step.completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                            </button>

                            <div className={`flex-1 bg-gray-900 border border-gray-800 rounded-2xl p-6 transition-all ${step.completed ? 'opacity-50 ring-1 ring-green-500/30' : 'hover:border-gray-700 hover:shadow-lg'}`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                    <h3 className={`text-lg font-bold ${step.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                                        {step.title}
                                    </h3>
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-800 px-3 py-1 rounded-full w-fit">
                                        <Clock className="h-3 w-3" />
                                        {step.estimatedTime}
                                    </span>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-center pt-8">
                         <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-center max-w-sm">
                             <Zap className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                             <h4 className="text-white font-bold">Stay Consistent!</h4>
                             <p className="text-xs text-gray-400 mt-1">The difference between a wish and a goal is a plan. You've got the plan, now execute.</p>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
}
