"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangle, Lock, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StrictProctoring() {
    const { logout, isAdmin } = useAuth();
    const router = useRouter();
    const [showWarning, setShowWarning] = useState(false);
    const [violationType, setViolationType] = useState<"tab-switch" | "fullscreen-exit" | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false); // Default to false to show prompt if auto-fail

    const [isPaused, setIsPaused] = useState(false);

    // Force Full Screen
    const enterFullScreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
        } catch (err) {
            console.error("Full screen denied (likely needs user interaction):", err);
            setIsFullScreen(false);
        }
    }, []);

    // Logout and Exit
    const handleLogout = async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
            await logout();
            router.push("/");
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    // Detect Tab Switch / Blur
    useEffect(() => {
        if (isAdmin) return;

        const handleVisibilityChange = () => {
            if (document.hidden && !isPaused) {
                setViolationType("tab-switch");
                setShowWarning(true);
            }
        };

        const handleFullScreenChange = () => {
            if (!document.fullscreenElement && !isPaused) {
                setIsFullScreen(false);
                setViolationType("fullscreen-exit");
                setShowWarning(true);
            } else if (document.fullscreenElement) {
                setIsFullScreen(true);
                setShowWarning(false);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullScreenChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullScreenChange);
        };
    }, [isPaused]); // Re-run when pause state changes

    // Initial Full Screen Request - REMOVED to fix "transient activation" error
    // useEffect(() => {
    //     enterFullScreen();
    // }, [enterFullScreen]);

    // Render "Safe Exit" Button when active
    if (!showWarning && isFullScreen && !isPaused) {
        return (
            <div className="fixed bottom-6 right-6 z-[9999]">
                <button
                    onClick={() => setIsPaused(true)}
                    className="bg-gray-800/80 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-full border border-gray-600 backdrop-blur-sm transition-colors flex items-center gap-2 shadow-lg"
                >
                    <Lock className="w-3 h-3 text-green-400" />
                    Strict Mode Active
                </button>
            </div>
        );
    }

    // Render Paused State Overlay
    if (isPaused && !showWarning) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-md text-center">
                    <h2 className="text-xl font-bold text-white mb-4">Session Paused</h2>
                    <p className="text-gray-400 mb-6">
                        Strict mode is temporarily disabled. You can switch tabs without penalty.
                    </p>
                    <button
                        onClick={() => {
                            setIsPaused(false);
                            enterFullScreen();
                        }}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        Resume Session
                    </button>
                </div>
            </div>
        );
    }

    if (isAdmin) return null;
    if (!showWarning && isFullScreen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4 text-center">
            {/* If just not in full screen, give option to re-enter */}
            {!isFullScreen && !violationType && (
                <div className="bg-gray-900 border border-red-500 rounded-2xl p-8 max-w-md shadow-2xl animate-in zoom-in">
                    <Lock className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">Secure Session Required</h2>
                    <p className="text-gray-400 mb-6">
                        Strict mode is active. You must be in full screen to continue.
                    </p>
                    <button
                        onClick={enterFullScreen}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
                    >
                        Enter Full Screen
                    </button>
                </div>
            )}

            {/* Violation Warning */}
            {showWarning && (
                <div className="bg-red-950 border-2 border-red-500 rounded-2xl p-8 max-w-md shadow-[0_0_50px_rgba(239,68,68,0.5)] animate-in bounce-in">
                    <div className="w-20 h-20 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" />
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">Security Violation!</h2>

                    <p className="text-red-200 text-lg mb-8">
                        {violationType === "tab-switch"
                            ? "Tab switching is strictly prohibited."
                            : "Exiting full screen is not allowed."}
                        <br />
                        <span className="font-bold text-white block mt-2">
                            Do you want to check back in or end the session?
                        </span>
                    </p>

                    <div className="flex gap-4 w-full">
                        <button
                            onClick={() => {
                                setShowWarning(false);
                                setViolationType(null);
                                setIsFullScreen(true);
                                enterFullScreen();
                            }}
                            className="flex-1 bg-gray-200 hover:bg-white text-gray-900 font-bold py-3 px-4 rounded-xl transition-all"
                        >
                            Resume Session
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            End Session
                        </button>
                    </div>

                    <p className="mt-4 text-xs text-red-400/50 uppercase tracking-widest">
                        Incident Recorded
                    </p>
                </div>
            )}
        </div>
    );
}
