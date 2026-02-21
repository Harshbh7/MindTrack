"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";

interface SharedTimerProps {
    roomId: string;
}

export default function SharedTimer({ roomId }: SharedTimerProps) {
    const { socket, isConnected } = useSocket();
    const [seconds, setSeconds] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<"focus" | "break">("focus");

    // Format time
    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (socket && isConnected) {
            socket.on("timer-update", (data: any) => {
                setSeconds(data.seconds);
                setIsActive(data.isActive);
                setMode(data.mode);
            });

            return () => {
                socket.off("timer-update");
            };
        }
    }, [socket, isConnected]);

    // Local tick (optimistic) + Sync
    // Real implementation would rely on server ticking or timestamp diffs to avoid drift.
    // For MVP/UI demo, we'll just emit actions.
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds((prev) => prev - 1);
            }, 1000);
        } else if (seconds === 0) {
            setIsActive(false);
            // Play sound?
        }
        return () => clearInterval(interval);
    }, [isActive, seconds]);

    const toggleTimer = () => {
        const newState = !isActive;
        setIsActive(newState);
        if (socket) {
            socket.emit("timer-action", { roomId, action: newState ? "start" : "pause", seconds, mode });
        }
    };

    const resetTimer = () => {
        const newSeconds = mode === "focus" ? 25 * 60 : 5 * 60;
        setSeconds(newSeconds);
        setIsActive(false);
        if (socket) {
            socket.emit("timer-action", { roomId, action: "reset", seconds: newSeconds, mode });
        }
    };

    const switchMode = () => {
        const newMode = mode === "focus" ? "break" : "focus";
        const newSeconds = newMode === "focus" ? 25 * 60 : 5 * 60;
        setMode(newMode);
        setSeconds(newSeconds);
        setIsActive(false);
        if (socket) {
            socket.emit("timer-action", { roomId, action: "reset", seconds: newSeconds, mode: newMode });
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col items-center shadow-lg">
            <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs uppercase tracking-wider">
                <Clock className="w-3 h-3" />
                <span>Room Timer ({mode})</span>
            </div>

            <div className={`text-4xl font-mono font-bold mb-4 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                {formatTime(seconds)}
            </div>

            <div className="flex gap-2 w-full">
                <button
                    onClick={toggleTimer}
                    disabled={!isConnected}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                >
                    {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                    onClick={resetTimer}
                    disabled={!isConnected}
                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>
            <button onClick={switchMode} className="mt-2 text-xs text-gray-500 hover:text-gray-300 underline">
                Switch to {mode === "focus" ? "Break" : "Focus"}
            </button>
        </div>
    );
}
