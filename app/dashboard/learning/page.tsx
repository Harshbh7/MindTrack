"use client";

import { useState, useEffect } from "react";
import { Send, Bot, BookOpen, PlayCircle, ExternalLink, Plus, X, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, push, onValue, query, orderByChild, equalTo, serverTimestamp } from "firebase/database";
import FocusTimer from "@/components/FocusTimer";
import FlashcardGenerator from "@/components/FlashcardGenerator";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Resource {
    id: string;
    title: string;
    link: string;
    type: "video" | "playlist" | "article";
    status: "approved" | "pending" | "rejected";
    submittedBy: string;
    submittedByName: string;
}

const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        const textToCopy = String(children).replace(/\n$/, "");
        navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return !inline && match ? (
        <div className="relative group my-4">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border border-gray-800 rounded-t-lg text-xs text-gray-400 font-mono">
                <span>{match[1]}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                    title="Copy code"
                >
                    {isCopied ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span className="text-green-500 font-medium">Copied!</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                style={vscDarkPlus as any}
                language={match[1]}
                PreTag="div"
                className="!mt-0 !bg-gray-950 border border-t-0 border-gray-800 !rounded-t-none rounded-b-lg scrollbar-thin scrollbar-thumb-gray-800"
                {...props}
            >
                {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
        </div>
    ) : (
        <code className="bg-gray-900 border border-gray-700 text-blue-300 rounded px-1.5 py-0.5 text-xs font-mono" {...props}>
            {children}
        </code>
    );
};

export default function LearningPage() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([
        { role: "assistant", content: "Hello! I'm your AI Tutor. Ask me anything about your studies or code." }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Resource State
    const [resources, setResources] = useState<Resource[]>([]);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [newResource, setNewResource] = useState({ title: "", link: "", type: "video" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Active Video State for Study Mode
    const [activeVideo, setActiveVideo] = useState<Resource | null>(null);

    // Fetch Approved Resources from Realtime DB
    useEffect(() => {
        const videosRef = query(ref(realtimeDb, "video"), orderByChild("status"), equalTo("approved"));
        const unsubscribe = onValue(videosRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([key, value]: [string, any]) => ({
                    id: key,
                    ...value,
                }));
                // Client-side filtering if composite query is tricky or just to be safe
                const approved = list.filter(r => r.status === "approved");
                setResources(approved);
            } else {
                setResources([]);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, userMessage] }),
                cache: "no-store",
            });

            const data = await response.json();
            if (response.ok && data.reply) {
                setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
            } else {
                setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${data.error || "Unknown API Error"}` }]);
            }
        } catch (error: any) {
            console.error("Chat error:", error);
            setMessages((prev) => [...prev, { role: "assistant", content: `Connection error: ${error.message || "Failed to reach server"}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitResource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newResource.title || !newResource.link) return;

        setIsSubmitting(true);
        try {
            const videosRef = ref(realtimeDb, "video");
            await push(videosRef, {
                ...newResource,
                status: "pending",
                submittedBy: user.uid,
                submittedByName: user.displayName || "Anonymous",
                createdAt: serverTimestamp(),
            });
            setShowSubmitModal(false);
            setNewResource({ title: "", link: "", type: "video" });
            alert("Resource submitted for admin approval!");
        } catch (error) {
            console.error("Error submitting resource:", error);
            alert("Failed to submit resource.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] gap-6 relative">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-900">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <div className="flex items-center">
                        {activeVideo && (
                            <button
                                onClick={() => setActiveVideo(null)}
                                className="mr-4 rounded-full p-2 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        )}
                        <h2 className="flex items-center text-2xl font-bold text-white">
                            <BookOpen className="mr-3 h-6 w-6 text-purple-400" />
                            {activeVideo ? "Study Mode" : "Learning Resources"}
                        </h2>
                    </div>
                    {!activeVideo && (
                        <button
                            onClick={() => setShowSubmitModal(true)}
                            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Submit Content</span>
                        </button>
                    )}
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeVideo ? (
                        <div className="flex flex-col xl:flex-row gap-6 h-full">
                            {/* Video Player */}
                            <div className="flex-1 flex flex-col min-h-[400px]">
                                <div className="relative w-full h-0 pb-[56.25%] bg-black rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
                                    <iframe
                                        className="absolute top-0 left-0 w-full h-full"
                                        src={`https://www.youtube.com/embed/${getYouTubeId(activeVideo.link)}?autoplay=1`}
                                        title={activeVideo.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div >
                                <h3 className="text-xl font-bold text-white mt-4">{activeVideo.title}</h3>
                                <div className="flex items-center mt-2 text-sm text-gray-400">
                                    <span className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded text-xs uppercase mr-3">
                                        {activeVideo.type}
                                    </span>
                                    <span>Submitted by {activeVideo.submittedByName}</span>
                                </div>
                            </div >

                            < div className="w-full xl:w-96 flex-shrink-0 space-y-4" >
                                <div className="p-4 bg-gray-950 rounded-xl border border-gray-800">
                                    <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Focus & Tracking</h4>
                                    <FocusTimer />
                                </div>
                                <FlashcardGenerator />
                            </div >
                        </div >
                    ) : (
                        /* Resource List Grid */
                        resources.length === 0 ? (
                            <div className="text-center text-gray-500 py-20">
                                <p>No resources found. Be the first to submit one!</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                                {resources.map((res) => (
                                    <div key={res.id} className="group overflow-hidden rounded-xl border border-gray-800 bg-gray-950 transition-all hover:border-purple-500/50">
                                        <div className="aspect-video bg-gray-800 relative flex items-center justify-center group-hover:bg-gray-800/80">
                                            {getYouTubeId(res.link) ? (
                                                <img
                                                    src={`https://img.youtube.com/vi/${getYouTubeId(res.link)}/hqdefault.jpg`}
                                                    alt={res.title}
                                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-900" />
                                            )}
                                            <PlayCircle className="absolute h-12 w-12 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-xl" />
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold text-white line-clamp-2">{res.title}</h3>
                                                <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded uppercase">{res.type}</span>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">Shared by {res.submittedByName}</p>
                                            <button
                                                onClick={() => setActiveVideo(res)}
                                                className="mt-3 flex items-center text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
                                            >
                                                Start Learning <ExternalLink className="ml-1 h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div >
            </div >

            {/* AI Tutor Chat Section - Hidden in video mode if small screen, or persistent? Let's keep it but maybe collapse logic later if needed. For now keeping it. */}
            {
                !activeVideo && (
                    <div className="hidden xl:flex w-96 flex-col rounded-xl border border-gray-800 bg-gray-900">
                        <div className="border-b border-gray-800 p-4">
                            <h3 className="flex items-center font-semibold text-white">
                                <Bot className="mr-2 h-5 w-5 text-green-400" />
                                AI Tutor
                            </h3>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[90%] rounded-xl p-4 text-sm overflow-x-auto ${msg.role === "user"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-800 text-gray-200"
                                        }`}>
                                        {msg.role === "user" ? (
                                            msg.content
                                        ) : (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    code: CodeBlock,
                                                    p: ({ node, ...props }) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc ml-5 mb-3 space-y-1" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal ml-5 mb-3 space-y-1" {...props} />,
                                                    li: ({ node, ...props }) => <li className="" {...props} />,
                                                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 mt-4 text-white" {...props} />,
                                                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 mt-3 text-white" {...props} />,
                                                    h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-2 mt-3 text-white" {...props} />,
                                                    a: ({ node, ...props }) => <a className="text-blue-400 hover:text-blue-300 hover:underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                                                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-600 pl-4 py-1 my-3 italic text-gray-400 bg-gray-900/50 rounded-r-lg" {...props} />,
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-800 text-gray-400 rounded-xl p-3 text-xs animate-pulse">
                                        Thinking...
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSend} className="border-t border-gray-800 p-4">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    className="flex-1 rounded-lg border border-gray-700 bg-gray-800 p-2 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
                                    placeholder="Ask a question..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-500 disabled:opacity-50"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                )
            }

            {/* Submit Modal */}
            {
                showSubmitModal && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">Submit Resource</h3>
                                <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-white">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmitResource} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded-lg bg-gray-800 border border-gray-700 p-2.5 text-white focus:border-purple-500 focus:outline-none"
                                        placeholder="e.g., React Hooks Tutorial"
                                        value={newResource.title}
                                        onChange={e => setNewResource({ ...newResource, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Link URL</label>
                                    <input
                                        type="url"
                                        required
                                        className="w-full rounded-lg bg-gray-800 border border-gray-700 p-2.5 text-white focus:border-purple-500 focus:outline-none"
                                        placeholder="https://youtube.com/..."
                                        value={newResource.link}
                                        onChange={e => setNewResource({ ...newResource, link: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                                    <select
                                        className="w-full rounded-lg bg-gray-800 border border-gray-700 p-2.5 text-white focus:border-purple-500 focus:outline-none"
                                        value={newResource.type}
                                        onChange={e => setNewResource({ ...newResource, type: e.target.value as "video" })}
                                    >
                                        <option value="video">Video</option>
                                        <option value="playlist">Playlist</option>
                                        <option value="article">Article</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                                >
                                    {isSubmitting ? "Submitting..." : "Submit for Approval"}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
