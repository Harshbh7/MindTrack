"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, onValue, push, remove, update } from "firebase/database";
import { CheckCircle, Circle, Plus, Trash2, Target } from "lucide-react";

interface Goal {
    id: string;
    text: string;
    completed: boolean;
}

export default function StudyGoals() {
    const { user } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [newGoal, setNewGoal] = useState("");
    const [loading, setLoading] = useState(true);

    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (!user) return;

        const goalsRef = ref(realtimeDb, `users/${user.uid}/goals/${todayStr}`);
        const unsubscribe = onValue(goalsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loadedGoals = Object.entries(data).map(([key, val]: [string, any]) => ({
                    id: key,
                    text: val.text,
                    completed: val.completed
                }));
                // Sort incomplete goals to the top
                loadedGoals.sort((a, b) => {
                    if (a.completed === b.completed) return 0;
                    return a.completed ? 1 : -1;
                });
                setGoals(loadedGoals);
            } else {
                setGoals([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, todayStr]);

    const addGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoal.trim() || !user) return;

        const goalsRef = ref(realtimeDb, `users/${user.uid}/goals/${todayStr}`);
        await push(goalsRef, {
            text: newGoal,
            completed: false,
            createdAt: Date.now()
        });
        setNewGoal("");
    };

    const toggleGoal = async (id: string, currentStatus: boolean) => {
        if (!user) return;
        const goalRef = ref(realtimeDb, `users/${user.uid}/goals/${todayStr}/${id}`);
        await update(goalRef, { completed: !currentStatus });
    };

    const deleteGoal = async (id: string) => {
        if (!user) return;
        const goalRef = ref(realtimeDb, `users/${user.uid}/goals/${todayStr}/${id}`);
        await remove(goalRef);
    };

    if (loading) return <div className="h-48 animate-pulse bg-gray-100 dark:bg-gray-900 rounded-xl"></div>;

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6 h-fit max-h-[500px] flex flex-col transition-colors">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-red-500" />
                Daily Goals
            </h3>

            <div className="overflow-y-auto space-y-3 mb-4 pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                {goals.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-6">No goals set for today. Aim high!</p>
                ) : (
                    goals.map((goal) => (
                        <div key={goal.id} className="group flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <button
                                    onClick={() => toggleGoal(goal.id, goal.completed)}
                                    className={`transition-colors ${goal.completed ? "text-green-500" : "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
                                >
                                    {goal.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                </button>
                                <span className={`text-sm ${goal.completed ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-700 dark:text-gray-200"} truncate`}>
                                    {goal.text}
                                </span>
                            </div>
                            <button
                                onClick={() => deleteGoal(goal.id)}
                                className="text-gray-400 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={addGoal} className="relative mt-auto">
                <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Add a new goal..."
                    className="w-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
