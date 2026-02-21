"use client";

import { useState, useEffect } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, onValue, set, remove, update } from "firebase/database";

export default function TodoWidget() {
    const { user } = useAuth();
    const [todos, setTodos] = useState<{ id: string; text: string; done: boolean }[]>([]);
    const [newItem, setNewItem] = useState("");

    useEffect(() => {
        if (!user) return;
        const todosRef = ref(realtimeDb, `users/${user.uid}/todos`);
        const unsub = onValue(todosRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const todosArray = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                // Sort by uncompleted first, then chronological
                todosArray.sort((a, b) => {
                    if (a.done === b.done) {
                        return Number(a.id) - Number(b.id);
                    }
                    return a.done ? 1 : -1;
                });
                setTodos(todosArray);
            } else {
                setTodos([]);
            }
        });
        return () => unsub();
    }, [user]);

    const toggle = (id: string) => {
        if (!user) return;
        const todoToUpdate = todos.find(t => t.id === id);
        if (todoToUpdate) {
            update(ref(realtimeDb, `users/${user.uid}/todos/${id}`), {
                done: !todoToUpdate.done
            });
        }
    };

    const add = () => {
        if (!newItem.trim() || !user) return;
        const id = Date.now().toString();
        set(ref(realtimeDb, `users/${user.uid}/todos/${id}`), {
            text: newItem.trim(),
            done: false
        });
        setNewItem("");
    };

    const removeTask = (id: string) => {
        if (!user) return;
        remove(ref(realtimeDb, `users/${user.uid}/todos/${id}`));
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="font-bold text-white mb-4">Quick Tasks</h3>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2">
                {todos.map(t => (
                    <div key={t.id} className="flex items-center gap-2 group">
                        <button
                            onClick={() => toggle(t.id)}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${t.done ? 'bg-green-600 border-green-600' : 'border-gray-600 hover:border-gray-500'}`}
                        >
                            {t.done && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <span className={`text-sm flex-1 ${t.done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                            {t.text}
                        </span>
                        <button onClick={() => removeTask(t.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && add()}
                    placeholder="New task..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
                />
                <button
                    onClick={add}
                    className="bg-purple-600 hover:bg-purple-500 text-white p-1 rounded-lg"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
