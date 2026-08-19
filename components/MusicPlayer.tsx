"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Music, SkipForward } from "lucide-react";

const TRACKS = [
    {
        id: "lofi",
        name: "Chill Lo-Fi Beats",
        url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lo-fi-112891.mp3", // Free Pixabay Lo-Fi
        color: "bg-purple-500"
    },
    {
        id: "rain",
        name: "Rainy Mood",
        url: "https://cdn.pixabay.com/download/audio/2022/07/04/audio_3d1266ed2a.mp3?filename=rain-114253.mp3", // Free Pixabay Rain
        color: "bg-blue-500"
    },
    {
        id: "piano",
        name: "Ambient Piano",
        url: "https://cdn.pixabay.com/download/audio/2022/03/09/audio_c8c8a73467.mp3?filename=piano-moment-111718.mp3",
        color: "bg-pink-500"
    }
];

export default function MusicPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const [isMinimized, setIsMinimized] = useState(true);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const currentTrack = TRACKS[currentTrackIndex];

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        // When track changes, if it was playing, keep playing
        if (isPlaying && audioRef.current) {
            audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        }
    }, [currentTrackIndex]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        }
        setIsPlaying(!isPlaying);
    };

    const nextTrack = () => {
        setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    };

    return (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isMinimized ? "w-14 h-14" : "w-72"}`}>
            <audio
                ref={audioRef}
                src={currentTrack.url}
                loop
                onEnded={nextTrack}
            />

            {/* Minimized View */}
            {isMinimized ? (
                <button
                    onClick={() => setIsMinimized(false)}
                    className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white ${currentTrack.color} hover:scale-105 transition-transform animate-pulse-slow border-2 border-white/40`}
                >
                    <Music className={`w-6 h-6 ${isPlaying ? "animate-spin-slow" : ""}`} />
                </button>
            ) : (
                /* Expanded Player */
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4 overflow-hidden relative transition-colors">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Focus Music</span>
                        </div>
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Track Info */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-lg ${currentTrack.color} flex items-center justify-center shadow-md`}>
                            <Music className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-gray-900 dark:text-white font-bold truncate">{currentTrack.name}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">MindTrack FM</p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between gap-2">
                        {/* Volume */}
                        <div className="group relative flex items-center">
                            <button
                                onClick={() => setVolume(prev => prev === 0 ? 0.5 : 0)}
                                className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white p-2"
                            >
                                {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-lg shadow-xl">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="h-24 -rotate-90 w-6 accent-purple-600"
                                />
                            </div>
                        </div>

                        {/* Play/Pause */}
                        <button
                            onClick={togglePlay}
                            className="w-10 h-10 rounded-full bg-gray-900 text-white dark:bg-white dark:text-black flex items-center justify-center hover:scale-105 transition-transform shadow-md"
                        >
                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                        </button>

                        {/* Next */}
                        <button onClick={nextTrack} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white p-2">
                            <SkipForward className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Progress Bar (Fake for endless loops, or strictly visual) */}
                    <div className="mt-3 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${currentTrack.color} ${isPlaying ? "animate-progress-loading" : "w-1/3"}`} style={{ width: isPlaying ? '100%' : '30%' }} />
                    </div>
                </div>
            )}
        </div>
    );
}
