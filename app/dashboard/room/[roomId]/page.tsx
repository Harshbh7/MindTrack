"use client";

import { use, useState } from "react";
import Chat from "@/components/Chat";
import ParticipantList from "@/components/ParticipantList";
import FocusTimer from "@/components/FocusTimer";
import Whiteboard from "@/components/Whiteboard";
import VideoCall from "@/components/VideoCall";
import SharedTimer from "@/components/SharedTimer";
import CodeEditor from "@/components/CodeEditor";
import { useAuth } from "@/context/AuthContext";
import { Video, PenTool, Code } from "lucide-react";

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = use(params);
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<"video" | "board" | "code" | "chat">("video");

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100dvh-6rem)] gap-4 p-2 md:p-4 lg:p-0">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col space-y-4 overflow-hidden relative min-h-[50vh] lg:min-h-0">
                {/* Mode Toggles */}
                <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                    <button
                        onClick={() => setActiveTab("video")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === "video"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                            }`}
                    >
                        <Video className="w-4 h-4" />
                        Focus & Video
                    </button>
                    <button
                        onClick={() => setActiveTab("board")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === "board"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                            }`}
                    >
                        <PenTool className="w-4 h-4" />
                        Whiteboard
                    </button>
                    <button
                        onClick={() => setActiveTab("code")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === "code"
                            ? "bg-green-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                            }`}
                    >
                        <Code className="w-4 h-4" />
                        Code Editor
                    </button>
                    
                    {/* Mobile Only Chat Tab */}
                    <button
                        onClick={() => setActiveTab("chat")}
                        className={`lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === "chat"
                            ? "bg-pink-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                            }`}
                    >
                        Chat
                    </button>

                    <div className="ml-auto bg-gray-800 px-3 py-2 rounded-lg text-xs lg:text-sm text-gray-400 border border-gray-700 shrink-0">
                        Room: <span className="font-mono text-white ml-2">{roomId}</span>
                    </div>
                </div>

                {/* Content View */}
                <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden relative">
                    {/* Chat Tab (Mobile) */}
                    <div className={`h-full p-2 ${activeTab === 'chat' ? 'block' : 'hidden md:hidden'}`}>
                         <Chat roomId={roomId} />
                    </div>

                    {/* Whiteboard Tab */}
                    <div className={`h-full ${activeTab === 'board' ? 'block' : 'hidden'}`}>
                        <Whiteboard
                            roomId={roomId}
                            userId={user?.uid || "guest"}
                            userName={user?.displayName || "Guest Agent"}
                        />
                    </div>

                    {/* Video Tab */}
                    <div className={`h-full overflow-y-auto ${activeTab === 'video' ? 'block' : 'hidden'}`}>
                        <div className="p-4 lg:p-6 h-full flex flex-col items-center gap-6">
                            <div className="w-full max-w-4xl h-full flex flex-col">
                                <h3 className="text-lg font-semibold text-gray-400 mb-4 flex items-center gap-2">
                                    <Video className="w-5 h-5" /> Video Collaboration
                                </h3>
                                <div className="flex-1 min-h-[300px]">
                                    {user && (
                                        <VideoCall
                                            roomId={roomId}
                                            userId={user.uid}
                                            userName={user.displayName || "User"}
                                            compactMode={false}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Code Tab */}
                    <div className={`h-full w-full bg-[#1e1e1e] ${activeTab === 'code' ? 'block' : 'hidden'}`}>
                        <div className="h-full w-full p-2 lg:p-4">
                            <CodeEditor />
                        </div>
                    </div>

                    {/* PIP Video Call (When NOT in Video Tab) */}
                    {activeTab !== "video" && user && (
                        <div className="absolute bottom-4 right-4 z-50">
                            <VideoCall
                                roomId={roomId}
                                userId={user.uid}
                                userName={user.displayName || "User"}
                                compactMode={true}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar - Chat & Participants (Desktop Only) */}
            <div className="hidden lg:flex w-80 flex-col gap-4 h-full shrink-0">
                <SharedTimer roomId={roomId} />
                <div className="flex-1 min-h-0 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <Chat roomId={roomId} />
                </div>
                <div className="h-1/3 min-h-[150px] bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <ParticipantList roomId={roomId} />
                </div>
            </div>

            {/* Mobile Footer Removed to save space as per user request */}
            {/* The main content area now uses the full height on mobile devices */}
        </div>
    );
}
