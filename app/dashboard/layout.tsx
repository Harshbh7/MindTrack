"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import MusicPlayer from "@/components/MusicPlayer";
import StrictProctoring from "@/components/StrictProctoring";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-gray-950 text-white relative">
                <StrictProctoring />
                <MusicPlayer />

                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                <div className="flex flex-1 flex-col overflow-hidden">
                    <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
                    <main className="flex-1 overflow-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
