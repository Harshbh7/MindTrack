"use client";

import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";
import { Download, Save, FileText, Printer, Share2 } from "lucide-react";

interface CollaborativeNotesProps {
    roomId?: string; // Optional if we want room-based notes later. Default to personal or global test.
}

export default function CollaborativeNotes({ roomId = "global-notes" }: CollaborativeNotesProps) {
    const { socket, isConnected } = useSocket();
    const { user } = useAuth();

    // Default content
    const [markdown, setMarkdown] = useState<string>("# Shared Notes\n\nStart typing to collaborate...");
    const [status, setStatus] = useState("Offline");
    const isRemoteUpdate = useRef(false);

    // Simple Regex Parser (Same as before)
    const parseMarkdown = (text: string) => {
        return text
            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-4 text-purple-400">$1</h1>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mb-3 mt-6 text-purple-300">$1</h2>')
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-medium mb-2 mt-4 text-purple-200">$1</h3>')
            .replace(/\*\*(.*)\*\*/gim, '<strong class="text-white">$1</strong>')
            .replace(/\*(.*)\*/gim, '<em class="text-gray-300">$1</em>')
            .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-gray-300">$1</li>')
            .replace(/\n\n/gim, '<br/><br/>');
    };

    useEffect(() => {
        if (!socket || !isConnected) {
            setStatus("Connecting...");
            return;
        }

        setStatus("Connected");

        // Join the notes room
        socket.emit("join-room", roomId, user?.uid || "anon");

        // Listen for updates
        socket.on("note-update", (newContent: string) => {
            isRemoteUpdate.current = true;
            setMarkdown(newContent);
            setTimeout(() => isRemoteUpdate.current = false, 100);
        });

        // Request initial state logic could go here similar to whiteboard
        // For simplicity, we just start listening. Real app needs persistence fetching.

        return () => {
            socket.off("note-update");
        };
    }, [socket, isConnected, roomId, user]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setMarkdown(newValue);

        if (!isRemoteUpdate.current && socket && isConnected) {
            socket.emit("note-change", { roomId, content: newValue });
        }
    };

    const handlePrint = () => window.print();

    return (
        <div className="flex flex-col gap-4 min-h-[calc(100vh-6rem)] md:h-[calc(100vh-6rem)]">
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        Collaborative Notes <span className="text-xs font-normal px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">{status}</span>
                    </h1>
                    <p className="text-sm md:text-base text-gray-400">Capture ideas together. Markdown supported.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 md:px-4 rounded-lg transition-colors text-sm md:text-base"
                    >
                        <Printer className="w-4 h-4" />
                        <span className="hidden sm:inline">Export PDF</span>
                    </button>
                    <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 md:px-4 rounded-lg transition-colors text-sm md:text-base">
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Share</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-4 md:overflow-hidden print:overflow-visible print:block">
                {/* Editor Input */}
                <div className="flex-1 flex flex-col bg-gray-900 border border-gray-800 rounded-xl p-4 print:hidden min-h-[50vh] md:min-h-0">
                    <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm uppercase tracking-wider">
                        <FileText className="w-4 h-4" />
                        <span>Markdown Editor</span>
                    </div>
                    <textarea
                        value={markdown}
                        onChange={handleChange}
                        className="flex-1 bg-transparent text-gray-200 font-mono resize-none focus:outline-none leading-relaxed"
                        placeholder="# Start typing..."
                    />
                </div>

                {/* Live Preview / Print View */}
                <div className="flex-1 bg-white text-black border border-gray-200 rounded-xl p-4 md:p-8 overflow-y-auto print:w-full print:h-full print:border-none print:shadow-none min-h-[50vh] md:min-h-0 bg-gradient-to-br from-white to-gray-50">
                    <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: parseMarkdown(markdown) }} />
                </div>
            </div>

            {/* Print Styles Helper */}
            <style jsx global>{`
                @media print {
                    @page { margin: 2cm; }
                    body { background: white; color: black; }
                    /* Hide parent layout elements */
                    nav, aside, .print\\:hidden { display: none !important; }
                    /* Reset Main Content Area to full width/height */
                    main { margin: 0; padding: 0; overflow: visible !important; }
                    /* Ensure Preview is visible */
                    .print\\:block { display: block !important; }
                    .print\\:w-full { width: 100% !important; }
                }
            `}</style>
        </div>
    );
}
