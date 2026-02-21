"use client";

import { use, useState } from "react";
import Chat from "@/components/Chat";
import ParticipantList from "@/components/ParticipantList";
import FocusTimer from "@/components/FocusTimer";
import Whiteboard from "@/components/Whiteboard";
import VideoCall from "@/components/VideoCall";
import SharedTimer from "@/components/SharedTimer";
import { useAuth } from "@/context/AuthContext";
import { Video, PenTool } from "lucide-react";

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = use(params);
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<"video" | "board">("video");

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
                    <div className="ml-auto bg-gray-800 px-3 py-2 rounded-lg text-xs lg:text-sm text-gray-400 border border-gray-700 shrink-0">
                        Room: <span className="font-mono text-white ml-2">{roomId}</span>
                    </div>
                </div>

                {/* Content View */}
                <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden relative">
                    {/* Always render Whiteboard to keep state if expensive, or conditional */}
                    {/* For performance, we usually hide it. But if we want to toggle quickly... */}

                    {activeTab === "board" && (
                        <Whiteboard
                            roomId={roomId}
                            userId={user?.uid || "guest"}
                            userName={user?.displayName || "Guest Agent"}
                        />
                    )}

                    {activeTab === "video" && (
                        <div className="p-4 lg:p-6 h-full overflow-y-auto flex flex-col items-center gap-6">
                            {/* FocusTimer removed to prevent camera conflict with VideoCall */}
                            <div className="w-full max-w-4xl h-full flex flex-col">
                                <h3 className="text-lg font-semibold text-gray-400 mb-4 flex items-center gap-2">
                                    <Video className="w-5 h-5" /> Video Collaboration
                                </h3>
                                {/* Video Call is rendered here when in "Video Mode" */}
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
                    )}

                    {/* PIP Video Call (When in Board Mode) */}
                    {activeTab === "board" && user && (
                        <VideoCall
                            roomId={roomId}
                            userId={user.uid}
                            userName={user.displayName || "User"}
                            compactMode={true}
                        />
                    )}
                </div>
            </div>

            {/* Sidebar - Chat & Participants */}
            {/* On mobile, this stacks below. On Desktop, it's side-by-side */}
            <div className="w-full lg:w-80 flex flex-col gap-4 h-[40vh] lg:h-auto shrink-0">
                <SharedTimer roomId={roomId} />
                <div className="flex-1 min-h-0 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <Chat roomId={roomId} />
                </div>
                {/* On mobile we might hide participant list or collapse it? Keeping it for now but smaller */}
                <div className="h-1/3 min-h-[150px] bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <ParticipantList roomId={roomId} />
                </div>
            </div>
        </div>
    );
}
