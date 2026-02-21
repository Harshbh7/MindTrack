"use client";

import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { Heart, Skull, Trophy, Swords, ShieldAlert } from "lucide-react";
import confetti from "canvas-confetti";

interface Player {
    id: string;
    hp: number;
    name: string;
    isSelf: boolean;
}

export default function FocusBattle() {
    const { socket, isConnected } = useSocket();
    const { user } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const { isFaceDetected, isModelLoaded } = useFaceDetection(videoRef); // Re-use hook for detection

    const [started, setStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const battleStartTime = useRef<number>(0);

    // Mock Opponent for Demo if no real socket peer (so it's playable solo/demo)
    // In prod, this would be empty array filling via socket
    const [players, setPlayers] = useState<Player[]>([
        { id: "me", hp: 100, name: "You", isSelf: true },
        { id: "bot", hp: 100, name: "Dark AI", isSelf: false }
    ]);

    // Game Loop
    useEffect(() => {
        if (!started || gameOver) return;

        const interval = setInterval(() => {
            setPlayers(prevPlayers => {
                return prevPlayers.map(p => {
                    if (p.isSelf) {
                        // Logic: If NO face detected AND AI models are loaded, and grace period passed
                        if (isModelLoaded && !isFaceDetected && Date.now() - battleStartTime.current > 2500) {
                            const newHp = Math.max(0, p.hp - 5);
                            if (newHp === 0 && !gameOver) {
                                // We died
                                handleGameOver("bot"); // Opponent wins
                            }
                            // Emit damage
                            if (socket) socket.emit("take-damage", { roomId: "battle-arena", userId: user?.uid, damage: 5 });
                            return { ...p, hp: newHp };
                        }
                    } else {
                        // Bot Logic: Randomly takes damage to simulate "fair fight"
                        if (Date.now() - battleStartTime.current > 2500 && Math.random() > 0.9) {
                            const newHp = Math.max(0, p.hp - 10);
                            if (newHp === 0 && !gameOver) {
                                handleGameOver("me"); // We win
                            }
                            return { ...p, hp: newHp };
                        }
                    }
                    return p;
                });
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [started, gameOver, isFaceDetected, isModelLoaded]);

    const handleGameOver = async (winnerId: string) => {
        setGameOver(true);
        setWinner(winnerId);
        if (winnerId === "me") {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

            // Add +50 XP to Firebase
            if (user) {
                try {
                    const { ref, get, set } = await import("firebase/database");
                    const { realtimeDb } = await import("@/lib/firebase");
                    const xpRef = ref(realtimeDb, `users/${user.uid}/gamification/xp`);
                    const snapshot = await get(xpRef);
                    const currentXp = snapshot.exists() ? snapshot.val() : 0;
                    await set(xpRef, currentXp + 50);
                } catch (e) {
                    console.error("Failed to save XP:", e);
                }
            }
        }
    };

    const startGame = () => {
        setStarted(true);
        setGameOver(false);
        battleStartTime.current = Date.now();
        setPlayers([
            { id: "me", hp: 100, name: "You", isSelf: true },
            { id: "bot", hp: 100, name: "Dark AI", isSelf: false }
        ]);
        if (socket && user) {
            socket.emit("join-battle", "battle-arena", user.uid);
        }
    };

    // Camera Init
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(s => setStream(s))
            .catch(err => console.error("Camera fail", err));
    }, []);

    // Assign stream when video element is rendered
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [started, gameOver, stream]);

    return (
        <div className="bg-gray-900 border-2 border-red-900/50 rounded-2xl p-6 w-full max-w-2xl mx-auto shadow-[0_0_50px_rgba(220,38,38,0.2)] relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-red-500 italic flex items-center gap-2 uppercase tracking-widest">
                        <Swords className="w-8 h-8" />
                        Focus Battle
                    </h2>
                    <div className="bg-red-900/40 border border-red-500/50 px-4 py-1 rounded text-red-200 text-xs font-bold">
                        BETA ARENA
                    </div>
                </div>

                {!started && !gameOver ? (
                    <div className="text-center py-10">
                        <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                            Challenge an opponent. Look away, and you lose HP. Last one standing wins XP.
                        </p>
                        <button
                            onClick={startGame}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 mx-auto"
                        >
                            <Swords className="w-5 h-5" />
                            ENTER ARENA
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-8">
                        {/* YOU */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-green-500 shadow-lg mb-4 bg-black">
                                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform -scale-x-100" />
                                {!isFaceDetected && !gameOver && (
                                    <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center animate-pulse">
                                        <ShieldAlert className="w-12 h-12 text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="w-full bg-gray-800 h-4 rounded-full overflow-hidden border border-gray-700">
                                <div
                                    className="h-full bg-gradient-to-r from-red-600 to-green-500 transition-all duration-300"
                                    style={{ width: `${players.find(p => p.isSelf)?.hp}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between w-full mt-2 text-sm font-bold">
                                <span className="text-green-400">YOU</span>
                                <span className="text-white">{players.find(p => p.isSelf)?.hp} HP</span>
                            </div>
                        </div>

                        {/* OPPONENT */}
                        <div className="flex flex-col items-center opacity-80">
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-red-500 shadow-lg mb-4 bg-gray-800 flex items-center justify-center">
                                <Skull className="w-16 h-16 text-red-900" />
                            </div>
                            <div className="w-full bg-gray-800 h-4 rounded-full overflow-hidden border border-gray-700">
                                <div
                                    className="h-full bg-red-600 transition-all duration-300"
                                    style={{ width: `${players.find(p => !p.isSelf)?.hp}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between w-full mt-2 text-sm font-bold">
                                <span className="text-red-400">DARK AI</span>
                                <span className="text-white">{players.find(p => !p.isSelf)?.hp} HP</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Game Over Overlay */}
                {gameOver && (
                    <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center text-center animate-in zoom-in">
                        {winner === "me" ? (
                            <>
                                <Trophy className="w-20 h-20 text-yellow-500 mb-4 animate-bounce" />
                                <h1 className="text-4xl font-black text-yellow-400 mb-2">VICTORY!</h1>
                                <p className="text-gray-300 mb-6">+50 XP Gained</p>
                            </>
                        ) : (
                            <>
                                <Skull className="w-20 h-20 text-red-600 mb-4" />
                                <h1 className="text-4xl font-black text-red-600 mb-2">DEFEAT</h1>
                                <p className="text-gray-300 mb-6">You lost focus.</p>
                            </>
                        )}
                        <button
                            onClick={startGame}
                            className="bg-white text-black font-bold py-2 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Play Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
