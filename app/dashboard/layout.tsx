"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import MusicPlayer from "@/components/MusicPlayer";
import StrictProctoring from "@/components/StrictProctoring";

import BroadcastBanner from "@/components/BroadcastBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-[#faf8f5] dark:bg-[#0c1017] text-stone-900 dark:text-stone-100 relative transition-colors">
                <StrictProctoring />
                <MusicPlayer />

                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                <div className="flex flex-1 flex-col overflow-hidden">
                    <BroadcastBanner />
                    <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
                    <main className="flex-1 overflow-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
