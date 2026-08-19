"use client";

import KanbanBoard from "@/components/KanbanBoard";

export default function KanbanPage() {
    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Project Tasks</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage your workflow with this kanban board.</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto lg:overflow-y-hidden lg:overflow-x-auto">
                <KanbanBoard />
            </div>
        </div>
    );
}
