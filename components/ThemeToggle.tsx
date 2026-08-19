"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 animate-pulse border border-stone-200 dark:border-stone-700"></div>
        );
    }

    const currentTheme = theme || resolvedTheme || "light";

    return (
        <button
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200/90 dark:border-stone-800 bg-white/80 dark:bg-stone-800/80 text-stone-700 dark:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-700/80 transition-all shadow-sm active:scale-95"
            title={`Switch to ${currentTheme === "dark" ? "Light" : "Dark"} Mode`}
            aria-label="Toggle theme"
        >
            {currentTheme === "dark" ? (
                <Sun className="h-4.5 w-4.5 text-amber-400 animate-spin-slow" />
            ) : (
                <Moon className="h-4.5 w-4.5 text-stone-600" />
            )}
        </button>
    );
}
