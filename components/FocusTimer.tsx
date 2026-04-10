"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useAuth } from "@/context/AuthContext";
import { useTimer } from "@/context/TimerContext";
import { useGamification } from "@/context/GamificationContext";
import { Play, Pause, RefreshCw, Smartphone, AlertTriangle, StopCircle } from "lucide-react";
import { realtimeDb } from "@/lib/firebase";
import { ref, set } from "firebase/database";
import SessionReport from "./SessionReport";

interface MoodEntry {
    timestamp: number;
    mood: string;
}

export default function FocusTimer() {
    const { user } = useAuth();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [strictMode, setStrictMode] = useState(true);
    const [wasAutoPaused, setWasAutoPaused] = useState(false);

    // AI Analysis State
    const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
    const [showReport, setShowReport] = useState(false);
    const [lastSessionDuration, setLastSessionDuration] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
    const moodRef = useRef<string | null>(null);

    // Call hook
    const { isModelLoaded, isFaceDetected, expressions, error: modelError } = useFaceDetection(videoRef);
    const { seconds, isRunning, startTimer, pauseTimer, resetTimer, formatTime } = useTimer();
    const { addXp } = useGamification();

    // XP Logic: Award 10 XP every 60 seconds of valid focus
    useEffect(() => {
        if (isRunning && isFaceDetected && seconds > 0 && seconds % 60 === 0) {
            addXp(10);
        }
        
        // Track session start
        if (isRunning && !sessionStartTime) {
            setSessionStartTime(Date.now());
        }
    }, [seconds, isRunning, isFaceDetected, addXp, sessionStartTime]);

    // Emotion Logic
    const currentMood = useMemo(() => {
        if (!expressions) return null;

        // Find dominant expression
        const dominant = Object.entries(expressions).reduce((a, b) => (a[1] > b[1] ? a : b));
        const mood = dominant[0]; // e.g., 'happy', 'sad', 'neutral'

        // Determine UI State
        let moodState = { emoji: "😐", text: "Focused", color: "text-blue-400", raw: mood };

        switch (mood) {
            case "happy":
                moodState = { emoji: "😊", text: "Great Energy!", color: "text-green-400", raw: mood };
                break;
            case "sad":
            case "angry":
            case "disgusted":
                moodState = { emoji: "😟", text: "Stressed?", color: "text-orange-400", raw: mood };
                break;
            case "surprised":
                moodState = { emoji: "😲", text: "Alert", color: "text-yellow-400", raw: mood };
                break;
            case "neutral":
            default:
                moodState = { emoji: "🧠", text: "Deep Focus", color: "text-blue-400", raw: mood };
                break;
        }

        if (mood === 'sad') {
            moodState = { emoji: "😴", text: "Need a break?", color: "text-red-400", raw: mood };
        }

        moodRef.current = moodState.raw;
        return moodState;
    }, [expressions]);

    // Track Mood History
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                const current = moodRef.current;
                if (current) {
                    setMoodHistory(prev => [...prev, { timestamp: Date.now(), mood: current }]);
                }
            }, 3000); // Consistent 3-second logging 
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const handleStartSession = () => {
        setMoodHistory([]);
        setSessionStartTime(Date.now());
        startTimer();
    };

    const handleStopSession = async () => {
        pauseTimer();
        setLastSessionDuration(seconds);
        
        // Persist to Firebase
        if (user && moodHistory.length > 0) {
            const sessionId = sessionStartTime || Date.now();
            const historyRef = ref(realtimeDb, `users/${user.uid}/emotionHistory/${sessionId}`);
            await set(historyRef, {
                duration: seconds,
                timestamp: sessionId,
                history: moodHistory
            });
        }
        
        setShowReport(true);
        setSessionStartTime(null);
    };

    const handleCloseReport = () => {
        setShowReport(false);
        setMoodHistory([]);
        setWasAutoPaused(false);
        resetTimer();
    };

    const handleManualPause = () => {
        setWasAutoPaused(false);
        pauseTimer();
    };

    // Auto-pause & resume logic
    useEffect(() => {
        if (!isModelLoaded || !strictMode) return;

        if (isRunning && !isFaceDetected) {
            pauseTimer();
            setWasAutoPaused(true);
        } else if (!isRunning && isFaceDetected && wasAutoPaused) {
            startTimer();
            setWasAutoPaused(false);
        }
    }, [isFaceDetected, isRunning, isModelLoaded, pauseTimer, startTimer, strictMode, wasAutoPaused]);

    // Initialize Camera Natively
    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240 }
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play();
                        setIsStreaming(true);
                    };
                }
            } catch (err: any) {
                console.error("Camera Error:", err);
                setCameraError(err.message || "Permission denied");
            }
        };

        startCamera();

        // Cleanup
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="flex flex-col items-center space-y-4 md:space-y-6 rounded-2xl border border-gray-800 bg-gray-900 p-4 md:p-8 shadow-2xl w-full max-w-md mx-auto">
            {/* Session Report Overlay */}
            {showReport && (
                <SessionReport
                    duration={lastSessionDuration}
                    moodHistory={moodHistory}
                    onClose={handleCloseReport}
                />
            )}

            <div className="relative overflow-hidden rounded-xl border-2 border-gray-700 shadow-lg w-full max-w-[320px] aspect-[4/3] bg-black">
                {/* 1. Native Video Element */}
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full rounded-xl object-cover transform -scale-x-100 transition-opacity duration-1000 ${isStreaming ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* 2. Error Layer */}
                {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gray-900 z-50">
                        <AlertTriangle className="h-10 w-10 text-red-500 mb-2" />
                        <p className="text-sm text-red-400 font-bold">Camera Failed</p>
                        <p className="text-xs text-gray-500 mt-1">{cameraError}</p>
                    </div>
                )}

                {/* 3. Loading Models Layer (Only shows if camera works but AI is prepping) */}
                {isStreaming && !isModelLoaded && !modelError && (
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg py-1 z-10">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mr-2"></div>
                        <span className="text-xs font-bold text-blue-200">Loading AI...</span>
                    </div>
                )}

                {/* 4. Model Error Layer */}
                {modelError && (
                    <div className="absolute top-2 left-2 right-2 bg-red-900/80 rounded-lg p-2 z-20">
                        <span className="text-xs text-white block text-center">AI Error: {modelError}</span>
                    </div>
                )}

                {/* 5. Status Overlay */}
                {isModelLoaded && isStreaming && (
                    <>
                        <div className={`absolute top-4 right-4 h-3 w-3 rounded-full border border-white shadow-sm ${isFaceDetected ? 'bg-green-500' : 'bg-red-500'}`} />

                        {/* Mood Indicator */}
                        {isFaceDetected && currentMood && (
                            <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                                <div className="bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-xl border border-gray-700">
                                    <span className="text-lg">{currentMood.emoji}</span>
                                    <span className={`text-sm font-bold ${currentMood.color}`}>{currentMood.text}</span>
                                </div>
                            </div>
                        )}

                        {!isFaceDetected && (
                            <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
                                <span className="bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                    LOOK AT CAMERA
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="text-center">
                <h2 className="text-4xl md:text-6xl font-mono font-bold text-white tracking-wider">
                    {formatTime(seconds)}
                </h2>
                <div className="mt-4 flex items-center justify-center gap-2">
                    <label className="flex items-center cursor-pointer gap-2">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={strictMode} onChange={() => setStrictMode(!strictMode)} />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${strictMode ? 'bg-red-500' : 'bg-gray-600'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${strictMode ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <span className="text-sm text-gray-300">Strict Mode (Auto-Pause)</span>
                    </label>
                </div>
                <p className="mt-2 text-gray-400">Total Focus Time</p>
            </div>

            <div className="flex space-x-4">
                {!isRunning ? (
                    <button
                        onClick={handleStartSession}
                        disabled={!isFaceDetected}
                        className={`flex items-center space-x-2 rounded-lg px-6 py-3 font-semibold text-white transition-all ${isFaceDetected ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 cursor-not-allowed opacity-50'}`}
                    >
                        <Play className="h-5 w-5" />
                        <span>Start Session</span>
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleManualPause}
                            className="flex items-center space-x-2 rounded-lg bg-yellow-600 px-6 py-3 font-semibold text-white transition-all hover:bg-yellow-500"
                        >
                            <Pause className="h-5 w-5" />
                            <span>Pause</span>
                        </button>

                        <button
                            onClick={handleStopSession}
                            className="flex items-center space-x-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-all hover:bg-red-500"
                        >
                            <StopCircle className="h-5 w-5" />
                            <span>Finish</span>
                        </button>
                    </>
                )}

            </div>
        </div>
    );
}
