"use client";

import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";
import { 
    Download, 
    Save, 
    FileText, 
    Printer, 
    Share2, 
    Bold, 
    Italic, 
    List, 
    ChevronRight, 
    Type,
    Copy,
    Check,
    Globe,
    Zap,
    Maximize2,
    Minimize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CollaborativeNotesProps {
    roomId?: string;
}

export default function CollaborativeNotes({ roomId = "global-notes" }: CollaborativeNotesProps) {
    const { socket, isConnected } = useSocket();
    const { user } = useAuth();

    const [markdown, setMarkdown] = useState<string>("# MindTrack Sync\n\nCollaborate in real-time. Use the toolbar or type markdown directly.\n\n## Features\n- **Real-time Sync**: Everyone sees updates instantly.\n- **Premium Preview**: Modern glassmorphic rendering.\n- **Export Ready**: Save as high-quality PDF.");
    const [status, setStatus] = useState("Offline");
    const [isCopied, setIsCopied] = useState(false);
    const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");
    const isRemoteUpdate = useRef(false);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    // Enhanced Regex Parser with modern typography
    const parseMarkdown = (text: string) => {
        return text
            .replace(/^# (.*$)/gim, '<h1 class="text-3xl md:text-4xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tight">$1</h1>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mb-4 mt-8 text-purple-300 border-b border-purple-500/20 pb-2">$1</h2>')
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mb-3 mt-6 text-purple-200/90">$1</h3>')
            .replace(/\*\*(.*)\*\*/gim, '<strong class="text-white font-bold">$1</strong>')
            .replace(/\*(.*)\*/gim, '<em class="text-purple-200/70 italic">$1</em>')
            .replace(/^\- (.*$)/gim, '<li class="ml-4 mb-2 flex items-start gap-2 text-gray-300"><span class="text-purple-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span><span>$1</span></li>')
            .replace(/`(.*?)`/gim, '<code class="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono text-sm border border-purple-500/30">$1</code>')
            .replace(/\n\n/gim, '<div class="h-4"></div>')
            .replace(/\n/gim, '<br/>');
    };

    useEffect(() => {
        if (!socket || !isConnected) {
            setStatus("Connecting...");
            return;
        }

        setStatus("Sync Active");
        socket.emit("join-room", roomId, user?.uid || "anon");

        socket.on("note-update", (newContent: string) => {
            isRemoteUpdate.current = true;
            setMarkdown(newContent);
            setTimeout(() => isRemoteUpdate.current = false, 100);
        });

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

    const insertText = (before: string, after: string = "") => {
        const textarea = textAreaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = markdown.substring(start, end);
        const newText = markdown.substring(0, start) + before + selectedText + after + markdown.substring(end);
        
        setMarkdown(newText);
        
        if (socket && isConnected) {
            socket.emit("note-change", { roomId, content: newText });
        }

        // Refocus and set cursor
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(markdown);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handlePrint = () => window.print();

    return (
        <div className="flex flex-col gap-6 min-h-[calc(100vh-8rem)]">
            {/* Premium Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden"
            >
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-xl shadow-lg shadow-purple-500/20">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">
                            MindTrack <span className="text-purple-500 uppercase text-sm tracking-[0.2em] font-bold">Sync</span>
                        </h1>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all duration-500 ${
                            isConnected ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            {status}
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm md:text-base font-medium">Real-time collaborative intelligence engine.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-4 py-2.5 rounded-xl transition-all active:scale-95 group font-medium"
                    >
                        {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 group-hover:text-purple-400" />}
                        <span>{isCopied ? "Copied" : "Copy Raw"}</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/25 active:scale-95 font-bold"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Export PDF</span>
                    </button>
                    <div className="h-10 w-[1px] bg-white/10 mx-1 hidden md:block" />
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                        {(["split", "editor", "preview"] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                                    viewMode === mode 
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20" 
                                    : "text-gray-500 hover:text-gray-300"
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Desktop Toolbar */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 bg-white/5 border border-white/10 p-2 rounded-2xl print:hidden backdrop-blur-md sticky top-0 z-10"
            >
                <div className="flex items-center gap-1 pr-2 border-r border-white/5">
                    <button onClick={() => insertText("# ", "")} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Heading 1"><Type className="w-5 h-5" /></button>
                    <button onClick={() => insertText("## ", "")} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors font-bold text-xs" title="Heading 2">H2</button>
                </div>
                <div className="flex items-center gap-1 px-2 border-r border-white/5">
                    <button onClick={() => insertText("**", "**")} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Bold"><Bold className="w-5 h-5" /></button>
                    <button onClick={() => insertText("*", "*")} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Italic"><Italic className="w-5 h-5" /></button>
                </div>
                <div className="flex items-center gap-1 px-2">
                    <button onClick={() => insertText("- ", "")} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="List"><List className="w-5 h-5" /></button>
                    <button onClick={() => insertText("`", "`")} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors font-mono font-bold" title="Code">{"{}"}</button>
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-3 px-3">
                    <div className="flex -space-x-2">
                         {[1, 2].map((i) => (
                             <div key={i} className={`w-8 h-8 rounded-full border-2 border-[#0a0a0b] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] text-white font-black shadow-lg`}>
                                 {i === 1 ? user?.email?.[0].toUpperCase() || "A" : "U"}
                             </div>
                         ))}
                    </div>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-widest hidden lg:block">Local Network 🛰️</span>
                </div>
            </motion.div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 h-[600px] md:h-auto overflow-hidden print:overflow-visible print:block">
                {/* Editor Section */}
                <AnimatePresence mode="wait">
                    {(viewMode === "split" || viewMode === "editor") && (
                        <motion.div 
                            key="editor"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className={`flex-1 flex flex-col bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-sm print:hidden transition-all duration-500 ${viewMode === 'editor' ? 'max-w-4xl mx-auto' : ''}`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-purple-400 text-xs font-black uppercase tracking-[0.2em]">
                                    <FileText className="w-4 h-4 text-purple-500" />
                                    <span>Workspace</span>
                                </div>
                                <span className="text-[10px] text-gray-600 font-mono">UTF-8 • Markdown</span>
                            </div>
                            <textarea
                                ref={textAreaRef}
                                value={markdown}
                                onChange={handleChange}
                                className="flex-1 bg-transparent text-gray-300 font-mono resize-none focus:outline-none leading-relaxed text-sm scrollbar-thin scrollbar-thumb-white/10"
                                placeholder="# Initialize your thoughts..."
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Preview Section */}
                <AnimatePresence mode="wait">
                    {(viewMode === "split" || viewMode === "preview") && (
                        <motion.div 
                            key="preview"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={`flex-1 flex flex-col bg-white/[0.03] border border-white/10 rounded-3xl p-8 md:p-12 overflow-y-auto print:w-full print:h-full print:border-none print:shadow-none bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-md transition-all duration-500 ${viewMode === 'preview' ? 'max-w-4xl mx-auto' : ''}`}
                        >
                            <div className="flex items-center gap-2 mb-8 text-pink-400 text-xs font-black uppercase tracking-[0.2em] print:hidden">
                                <Globe className="w-4 h-4 text-pink-500" />
                                <span>Preview Render</span>
                            </div>
                            <div 
                                className="prose prose-invert max-w-none text-gray-300 leading-relaxed prose-headings:text-white prose-strong:text-purple-400 prose-code:text-pink-300 selection:bg-purple-500/30 font-sans" 
                                dangerouslySetInnerHTML={{ __html: parseMarkdown(markdown) }} 
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Print Styles Helper */}
            <style jsx global>{`
                @media print {
                    @page { margin: 2cm; }
                    body { background: white !important; color: black !important; }
                    .prose { color: #1a1a1a !important; font-family: sans-serif; }
                    .prose h1, .prose h2, .prose h3 { color: #581c87 !important; border-bottom: 2px solid #e9d5ff !important; margin-top: 1.5rem !important; }
                    .prose strong { color: black !important; font-weight: 800; }
                    .prose-headings\:text-transparent { background: none !important; -webkit-background-clip: initial !important; background-clip: initial !important; border-bottom: 2px solid #581c87; color: #581c87 !important; }
                    /* Hide parent layout elements */
                    nav, aside, .print\\:hidden, .print\\:hidden * { display: none !important; }
                    /* Reset Main Content Area to full width/height */
                    main { margin: 0; padding: 0; overflow: visible !important; }
                    /* Ensure Preview is visible */
                    .print\\:block { display: block !important; }
                    .print\\:w-full { width: 100% !important; margin: 0 !important; padding: 0 !important; background: white !important; }
                }

                .scrollbar-thin::-webkit-scrollbar { width: 4px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
            `}</style>
        </div>
    );
}
