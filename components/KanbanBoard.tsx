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
        const newTask = { id: newTaskId, content: newTaskContent };

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

                    return (
                        <div key={column.id} className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-gray-900 rounded-xl border border-gray-800">
                            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-200">{column.title}</h3>
                                <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full">
                                    {tasks.length}
                                </span>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`flex-1 p-3 min-h-[150px] transition-colors ${snapshot.isDraggingOver ? "bg-gray-800/50" : ""}`}
                                    >
                                        {tasks.map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`bg-gray-800 p-3 mb-3 rounded-lg border border-gray-700 shadow-sm group hover:border-blue-500/50 transition-all ${snapshot.isDragging ? "shadow-lg scale-105 rotate-1" : ""}`}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-gray-200 text-sm">{task.content}</p>
                                                            <button
                                                                onClick={() => deleteTask(task.id, column.id)}
                                                                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}

                                        {isAdding && activeCol === column.id ? (
                                            <div className="mt-2 p-2 bg-gray-800 rounded-lg border border-gray-700 animate-in fade-in zoom-in-95">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Task description..."
                                                    className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none mb-2"
                                                    value={newTaskContent}
                                                    onChange={(e) => setNewTaskContent(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') addTask(column.id);
                                                        if (e.key === 'Escape') setIsAdding(false);
                                                    }}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setIsAdding(false)}
                                                        className="text-xs text-gray-400 hover:text-white px-2 py-1"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => addTask(column.id)}
                                                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded"
                                                    >
                                                        Add
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
                                                className="w-full mt-2 py-2 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors border border-dashed border-gray-800 hover:border-gray-700"
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
