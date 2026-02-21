"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, Users, BookOpen, Code, Trophy, X, Layout, FileText } from "lucide-react";
import clsx from "clsx";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Study Room", href: "/dashboard/room", icon: Users },
    { name: "Focus Timer", href: "/dashboard/timer", icon: Clock },
    { name: "Tasks", href: "/dashboard/tasks", icon: Layout },
    { name: "Coding Arena", href: "/dashboard/code", icon: Code },
    { name: "Learning", href: "/dashboard/learning", icon: BookOpen },
    { name: "Notes", href: "/dashboard/notes", icon: FileText },
    { name: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-800 bg-gray-900 transition-transform duration-300 ease-in-out md:static md:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        MindTrack
                    </h1>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-gray-400 hover:bg-gray-800 hover:text-white md:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="mt-6 space-y-1 px-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                className={clsx(
                                    "flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-600/10 text-blue-400"
                                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
