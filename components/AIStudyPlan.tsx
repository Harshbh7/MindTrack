"use client";

import { useState, useEffect } from "react";
import { Brain, CheckCircle2, Circle, Clock, ArrowRight, Sparkles, Calendar } from "lucide-react";
import { generateICS, downloadICS } from "@/utils/calendar";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, onValue, set, update } from "firebase/database";

interface Task {
    id: string;
    subject: string;
    topic: string;
    duration: string;
    completed: boolean;
    type: "review" | "practice" | "learn";
}

const AIStudyPlan = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [genError, setGenError] = useState<string | null>(null);

    const generateNewPlan = async (currentTasks: Task[] = []) => {
        if (!user || isGenerating) return;
        setIsGenerating(true);
        setGenError(null);
        try {
            const previousTopics = currentTasks.map(t => t.topic);
            const res = await fetch('/api/study-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ previousTopics })
            });
            const data = await res.json();

            if (res.ok && data.tasks && data.tasks.length > 0) {
                // Ensure IDs are unique for the new batch
                const standardizedTasks = data.tasks.map((t: any, i: number) => ({
                    ...t,
                    id: Date.now().toString() + '-' + i,
                    completed: false
                }));

                const planRef = ref(realtimeDb, `users/${user.uid}/studyPlan`);
                const uncompleted = currentTasks.filter(t => !t.completed);
                await set(planRef, [...uncompleted, ...standardizedTasks]);
            } else {
                setGenError(data.error || "Invalid response from AI server.");
            }
        } catch (error: any) {
            console.error("Failed to generate plan:", error);
            setGenError(error.message || "Failed to connect to AI server.");
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        const planRef = ref(realtimeDb, `users/${user.uid}/studyPlan`);
        const unsub = onValue(planRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const tasksArray = Array.isArray(data) ? data : Object.values(data);

                // If it's the old mock structure or empty, override it.
                if (tasksArray.some((t: any) => t.subject === 'Physics' || t.subject === 'Calculus') || tasksArray.length === 0) {
                    generateNewPlan([]);
                } else {
                    setTasks(tasksArray as Task[]);
                }
            } else {
                generateNewPlan([]);
            }
        });

        return () => unsub();
    }, [user]);

    const toggleTask = async (id: string) => {
        if (!user) return;

        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
            const currentStatus = tasks[taskIndex].completed;
            const planRef = ref(realtimeDb, `users/${user.uid}/studyPlan/${taskIndex}`);
            await update(planRef, { completed: !currentStatus });

            // After optimistic update logic, if everything is complete, generate more!
            // We use the new state mentally:
            const newTasks = [...tasks];
            newTasks[taskIndex].completed = !currentStatus;

            if (newTasks.every(t => t.completed)) {
                generateNewPlan(newTasks);
            }
        }
    };

    const handleExportCalendar = () => {
        const events = tasks.map((task, index) => {
            let minutes = 30;
            if (task.duration.includes('h')) minutes = parseInt(task.duration) * 60;
            else if (task.duration.includes('m')) minutes = parseInt(task.duration);

            const startTime = new Date();
            startTime.setDate(startTime.getDate() + 1);
            startTime.setHours(9 + index, 0, 0);

            return {
                title: `MindTrack: ${task.subject} - ${task.topic}`,
                description: `Focus on ${task.topic}. Type: ${task.type}`,
                startTime: startTime.toISOString(),
                durationMinutes: minutes
            };
        });

        const icsContent = generateICS(events);
        downloadICS("mindtrack-study-plan.ics", icsContent);
    };

    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 backdrop-blur-sm shadow-sm transition-colors">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                        <Brain className={`h-5 w-5 ${isGenerating ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            AI Study Plan
                            {isGenerating && <span className="text-[10px] bg-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-2 py-0.5 rounded-full animate-pulse">Thinking...</span>}
                        </h3>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Personalized for you
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleExportCalendar}
                        className="flex-1 sm:flex-none justify-center text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors border border-indigo-200 dark:border-indigo-500/30 px-3 py-2 sm:px-2 sm:py-1 rounded-md"
                    >
                        <Calendar className="w-3 h-3" /> Add to Calendar
                    </button>
                    <button
                        onClick={() => generateNewPlan(tasks)}
                        disabled={isGenerating}
                        className="flex-1 sm:flex-none justify-center text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors border border-gray-300 dark:border-gray-700 sm:border-transparent px-3 py-2 sm:px-0 sm:py-0 rounded-md disabled:opacity-50"
                    >
                        Generate New
                    </button>
                </div>
            </div>

            {genError && (
                <div className="mb-4 text-sm bg-red-900/50 border border-red-800 text-red-300 p-3 rounded-xl flex items-center justify-between">
                    <div>
                        <strong className="block text-red-200 mb-1">AI Generation Error</strong>
                        {genError}
                    </div>
                    <button onClick={() => setGenError(null)} className="text-red-500 hover:text-red-300 ml-3">✕</button>
                </div>
            )}

            <div className="space-y-3">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className={`group flex items-center justify-between p-3 rounded-lg border transition-all ${task.completed
                            ? "bg-gray-50/50 border-gray-200 opacity-60 dark:bg-gray-800/30 dark:border-gray-800"
                            : "bg-gray-50 border-gray-200 hover:border-indigo-300 hover:bg-white dark:bg-gray-800/50 dark:border-gray-700 dark:hover:border-indigo-500/30 dark:hover:bg-gray-800"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => toggleTask(task.id)}
                                className={`flex-shrink-0 transition-colors ${task.completed ? "text-green-500" : "text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                                    }`}
                            >
                                {task.completed ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                    <Circle className="h-5 w-5" />
                                )}
                            </button>
                            <div>
                                <h4 className={`text-sm font-medium ${task.completed ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-700 dark:text-gray-200"}`}>
                                    {task.topic}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${task.type === 'review' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                                        task.type === 'practice' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                                            'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                        }`}>
                                        {task.subject}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {task.duration}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {!task.completed && (
                            <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-all">
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">{tasks.filter(t => !t.completed).length}</span> upcoming sessions
                </div>
                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                    View Full Plan →
                </button>
            </div>
        </div>
    );
};

export default AIStudyPlan;
