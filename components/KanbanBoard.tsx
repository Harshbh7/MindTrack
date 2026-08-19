"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, X, GripVertical } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, onValue, set, push, remove } from "firebase/database";

interface Task {
    id: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
    category?: string;
    createdAt?: number;
}

interface Column {
    id: string;
    title: string;
    taskIds: string[];
}

interface BoardData {
    tasks: { [key: string]: Task };
    columns: { [key: string]: Column };
    columnOrder: string[];
}

const initialData: BoardData = {
    tasks: {},
    columns: {
        'todo': { id: 'todo', title: 'To Do', taskIds: [] },
        'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
        'done': { id: 'done', title: 'Done', taskIds: [] },
    },
    columnOrder: ['todo', 'in-progress', 'done'],
};

export default function KanbanBoard() {
    const { user } = useAuth();
    const [data, setData] = useState<BoardData>(initialData);
    const [newTaskContent, setNewTaskContent] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [isAdding, setIsAdding] = useState(false);
    const [activeCol, setActiveCol] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const boardRef = ref(realtimeDb, `users/${user.uid}/kanban`);
        const unsubscribe = onValue(boardRef, (snapshot) => {
            const val = snapshot.val();
            if (val) {
                // Ensure structure validity
                const validatedData = {
                    tasks: val.tasks || {},
                    columns: {
                        'todo': { ...initialData.columns['todo'], ...val.columns?.['todo'] },
                        'in-progress': { ...initialData.columns['in-progress'], ...val.columns?.['in-progress'] },
                        'done': { ...initialData.columns['done'], ...val.columns?.['done'] },
                    },
                    columnOrder: initialData.columnOrder,
                };
                // Ensure task data has new fields
                Object.keys(validatedData.tasks).forEach(tid => {
                    if (!validatedData.tasks[tid].priority) validatedData.tasks[tid].priority = 'medium';
                });
                // Ensure taskIds are arrays
                (Object.keys(validatedData.columns) as Array<keyof typeof validatedData.columns>).forEach(key => {
                    if (!validatedData.columns[key].taskIds) validatedData.columns[key].taskIds = [];
                });
                setData(validatedData);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const saveBoard = (newData: BoardData) => {
        if (!user) return;
        set(ref(realtimeDb, `users/${user.uid}/kanban`), newData);
    };

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const start = data.columns[source.droppableId];
        const finish = data.columns[destination.droppableId];

        if (start === finish) {
            const newTaskIds = Array.from(start.taskIds);
            newTaskIds.splice(source.index, 1);
            newTaskIds.splice(destination.index, 0, draggableId);

            const newColumn = {
                ...start,
                taskIds: newTaskIds,
            };

            const newState = {
                ...data,
                columns: {
                    ...data.columns,
                    [newColumn.id]: newColumn,
                },
            };

            setData(newState);
            saveBoard(newState);
            return;
        }

        // Moving from one list to another
        const startTaskIds = Array.from(start.taskIds);
        startTaskIds.splice(source.index, 1);
        const newStart = {
            ...start,
            taskIds: startTaskIds,
        };

        const finishTaskIds = Array.from(finish.taskIds);
        finishTaskIds.splice(destination.index, 0, draggableId);
        const newFinish = {
            ...finish,
            taskIds: finishTaskIds,
        };

        const newState = {
            ...data,
            columns: {
                ...data.columns,
                [newStart.id]: newStart,
                [newFinish.id]: newFinish,
            },
        };

        setData(newState);
        saveBoard(newState);
    };

    const addTask = (columnId: string) => {
        if (!newTaskContent.trim()) return;

        const newTaskId = `task-${Date.now()}`;
        const newTask: Task = { 
            id: newTaskId, 
            content: newTaskContent,
            priority: newTaskPriority,
            category: 'General',
            createdAt: Date.now()
        };

        const column = data.columns[columnId];
        const newTaskIds = [...column.taskIds, newTaskId];

        const newState = {
            ...data,
            tasks: {
                ...data.tasks,
                [newTaskId]: newTask,
            },
            columns: {
                ...data.columns,
                [columnId]: {
                    ...column,
                    taskIds: newTaskIds,
                }
            }
        };

        setData(newState);
        saveBoard(newState);
        setNewTaskContent("");
        setNewTaskPriority('medium');
        setIsAdding(false);
    };

    const deleteTask = (taskId: string, columnId: string) => {
        const column = data.columns[columnId];
        const newTaskIds = column.taskIds.filter(id => id !== taskId);

        const newTasks = { ...data.tasks };
        delete newTasks[taskId]; // optimistic delete

        const newState = {
            ...data,
            tasks: newTasks,
            columns: {
                ...data.columns,
                [columnId]: {
                    ...column,
                    taskIds: newTaskIds,
                }
            }
        };

        setData(newState);
        saveBoard(newState);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-col lg:flex-row h-full gap-6 pb-4 px-1 lg:px-0">
                {data.columnOrder.map((columnId) => {
                    const column = data.columns[columnId];
                    const tasks = column.taskIds.map(taskId => data.tasks[taskId]).filter(Boolean);
                    
                    const headerGradients = {
                        'todo': 'from-purple-600/20 to-pink-600/5 border-purple-500/20',
                        'in-progress': 'from-blue-600/20 to-cyan-600/5 border-blue-500/20',
                        'done': 'from-emerald-600/20 to-teal-600/5 border-emerald-500/20'
                    };

                    return (
                        <div key={column.id} className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800/50 shadow-sm overflow-hidden transition-colors">
                            <div className={`p-4 border-b bg-gradient-to-br ${headerGradients[columnId as keyof typeof headerGradients]} flex justify-between items-center bg-opacity-10`}>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">{column.title}</h3>
                                </div>
                                <span className="bg-gray-100 dark:bg-black/30 backdrop-blur-md text-gray-700 dark:text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-gray-200 dark:border-white/10">
                                    {tasks.length}
                                </span>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`flex-1 p-3 min-h-[150px] transition-colors ${snapshot.isDraggingOver ? "bg-gray-50 dark:bg-gray-800/50" : ""}`}
                                    >
                                        {tasks.map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                {(provided, snapshot) => {
                                                    const priorityColors = {
                                                        high: 'border-l-red-500',
                                                        medium: 'border-l-yellow-500',
                                                        low: 'border-l-blue-500'
                                                    };

                                                    return (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`bg-white dark:bg-white/5 backdrop-blur-md p-4 mb-3 rounded-xl border border-gray-200 dark:border-white/10 border-l-4 ${priorityColors[task.priority]} shadow-sm group hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all ${snapshot.isDragging ? "shadow-2xl scale-105 z-50 ring-2 ring-purple-500/50" : ""}`}
                                                        >
                                                            <div className="flex justify-between items-start gap-3">
                                                                <div className="flex-1">
                                                                    <p className="text-gray-900 dark:text-white text-sm font-medium leading-relaxed">{task.content}</p>
                                                                    {task.category && (
                                                                        <span className="inline-block mt-2 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-500/20 uppercase tracking-tighter">
                                                                            {task.category}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => deleteTask(task.id, column.id)}
                                                                    className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                }}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}

                                        {isAdding && activeCol === column.id ? (
                                            <div className="mt-2 p-4 bg-white dark:bg-gray-800/80 backdrop-blur-md rounded-xl border border-gray-200 dark:border-white/10 animate-in fade-in zoom-in-95 shadow-xl">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="What needs to be done?"
                                                    className="w-full bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none mb-3 border-b border-gray-200 dark:border-white/10 pb-2"
                                                    value={newTaskContent}
                                                    onChange={(e) => setNewTaskContent(e.target.value)}
                                                />
                                                
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {(['low', 'medium', 'high'] as const).map((p) => (
                                                        <button
                                                            key={p}
                                                            onClick={() => setNewTaskPriority(p)}
                                                            className={`text-[10px] uppercase font-black px-2 py-1 rounded-md border transition-all ${
                                                                newTaskPriority === p 
                                                                ? p === 'high' ? 'bg-red-500/20 border-red-500 text-red-500' 
                                                                  : p === 'medium' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
                                                                  : 'bg-blue-500/20 border-blue-500 text-blue-500'
                                                                : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300 dark:hover:border-white/30'
                                                            }`}
                                                        >
                                                            {p}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <button
                                                        onClick={() => setIsAdding(false)}
                                                        className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => addTask(column.id)}
                                                        className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-lg shadow-md shadow-purple-500/20 transition-all active:scale-95"
                                                    >
                                                        Add Task
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setIsAdding(true);
                                                    setActiveCol(column.id);
                                                    setNewTaskContent("");
                                                }}
                                                className="w-full mt-2 py-2 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-dashed border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700"
                                            >
                                                <Plus className="w-4 h-4" /> Add Task
                                            </button>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );
}
