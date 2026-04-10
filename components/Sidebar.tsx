"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, Clock, Users, BookOpen, Code, Trophy, 
    X, Layout, FileText, Shield, BarChart2, Globe, GitMerge, Youtube, Sparkles 
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Study Room", href: "/dashboard/room", icon: Users },
    { name: "Focus Timer", href: "/dashboard/timer", icon: Clock },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
    { name: "Learning Lab", href: "/dashboard/learning", icon: BookOpen },
    { name: "Community Decks", href: "/dashboard/community", icon: Globe },
    { name: "Roadmap", href: "/dashboard/roadmap", icon: GitMerge },
    { name: "Tasks", href: "/dashboard/tasks", icon: Layout },
    { name: "Coding Arena", href: "/dashboard/code", icon: Code },
    { name: "Notes", href: "/dashboard/notes", icon: FileText },
    { name: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { isAdmin } = useAuth();

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
                    "fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-transform duration-300 ease-in-out md:static md:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent">
                        MindTrack
                    </h1>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white md:hidden"
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
                                        ? "bg-blue-50 text-blue-600 dark:bg-blue-600/10 dark:text-blue-400"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}

                    {isAdmin && (
                        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
                            <Link
                                href="/dashboard/admin"
                                onClick={onClose}
                                className={clsx(
                                    "flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-bold transition-colors",
                                    pathname === "/dashboard/admin"
                                        ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                        : "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                                )}
                            >
                                <Shield className="h-5 w-5" />
                                <span>Admin Panel</span>
                            </Link>
                        </div>
                    )}
                </nav>
            </aside>
        </>
    );
}
