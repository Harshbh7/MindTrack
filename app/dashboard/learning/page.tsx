"use client";

import { useState, useEffect } from "react";
import { Send, Bot, BookOpen, PlayCircle, ExternalLink, Plus, X, ArrowLeft, Youtube, Sparkles, FileText, Info, Wand2, Brain, RotateCw, ArrowRight, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, push, onValue, query, orderByChild, equalTo, serverTimestamp, set } from "firebase/database";
import { MindSwal, Toast } from "@/lib/swal";
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
    const [selfStudyUrl, setSelfStudyUrl] = useState("");
    
    // Study Suite State
    const [notes, setNotes] = useState("");
    const [aiSummary, setAiSummary] = useState("");
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [flashcardLoading, setFlashcardLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"library" | "cards">("library");
    const [userDecks, setUserDecks] = useState<any[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

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

    // Fetch User Decks
    useEffect(() => {
        if (!user) return;
        const decksRef = ref(realtimeDb, `users/${user.uid}/decks`);
        const unsub = onValue(decksRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([key, val]: [string, any]) => ({
                    id: key,
                    ...val,
                    cardCount: val.cards ? Object.keys(val.cards).length : 0
                }));
                setUserDecks(list);
            } else {
                setUserDecks([]);
            }
        });
        return () => unsub();
    }, [user]);

    const handleCreateDeck = async (titleParam?: string) => {
        let title = titleParam;
        
        if (!title) {
            const { value: input } = await MindSwal.fire({
                title: 'New Deck Kit',
                input: 'text',
                inputPlaceholder: 'Enter deck name (e.g. React Hooks)',
                showCancelButton: true,
                inputValidator: (value) => {
                  if (!value) return 'Title is required!';
                  return null;
                }
            });
            title = input;
        }

        if (!title || !user) return null;
        
        try {
            const decksRef = ref(realtimeDb, `users/${user.uid}/decks`);
            const newDeckRef = push(decksRef);
            await set(newDeckRef, {
                title,
                createdAt: Date.now(),
                cards: {}
            });
            Toast.fire({
                icon: 'success',
                title: `Deck "${title}" created!`
            });
            return newDeckRef.key;
        } catch (error: any) {
            console.error("Create Deck error:", error);
            Toast.fire({
                icon: 'error',
                title: 'Failed to create deck'
            });
            return null;
        }
    };

    const handleDeleteDeck = async (e: React.MouseEvent, deckId: string) => {
        e.stopPropagation(); // Avoid opening the deck
        
        const result = await MindSwal.fire({
            title: 'Delete this kit?',
            text: "All flashcards in this deck will be permanently removed.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete kit'
        });

        if (!result.isConfirmed || !user) return;

        try {
            const deckRef = ref(realtimeDb, `users/${user.uid}/decks/${deckId}`);
            await set(deckRef, null);
            Toast.fire({
                icon: 'success',
                title: 'Deck deleted.'
            });
        } catch (error) {
            console.error("Delete error:", error);
            Toast.fire({
                icon: 'error',
                title: 'Failed to delete deck'
            });
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
            
            MindSwal.fire({
                icon: 'success',
                title: 'Submitted!',
                text: 'Your resource has been sent for admin approval. Thank you for contributing! 🙌',
                confirmButtonText: 'Great!'
            });
        } catch (error) {
            console.error("Error submitting resource:", error);
            Toast.fire({
                icon: 'error',
                title: 'Failed to submit resource'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleGenerateSummary = async () => {
        if (!activeVideo) return;
        setSummaryLoading(true);
        try {
            const res = await fetch('/api/ai/video-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: activeVideo.title })
            });
            const data = await res.json();
            if (data.summary) setAiSummary(data.summary);
        } catch (error) {
            console.error("Summary error:", error);
        } finally {
            setSummaryLoading(false);
        }
    };

    const handleNotesToFlashcards = async () => {
        const content = notes || aiSummary;
        if (!content || !user) {
            alert("No notes or summary found to generate flashcards.");
            return;
        }
        setFlashcardLoading(true);
        try {
            const res = await fetch('/api/ai/flashcards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: content, count: 5 })
            });
            const data = await res.json();
            if (data.flashcards) {
                // Determine deck: Use active video title or "Video Study"
                let targetDeckId = userDecks.find(d => d.title === (activeVideo?.title || "Video Study"))?.id;
                
                if (!targetDeckId) {
                    targetDeckId = await handleCreateDeck(activeVideo?.title || "Video Study");
                }

                if (targetDeckId && user) {
                    const flashcardsRef = ref(realtimeDb, `users/${user.uid}/decks/${targetDeckId}/cards`);
                    for (const card of data.flashcards) {
                        await push(flashcardsRef, {
                            ...card,
                            createdAt: Date.now(),
                            interval: 0,
                            repetition: 0,
                            efactor: 2.5,
                            nextReviewDate: Date.now()
                        });
                    }
                    
                    MindSwal.fire({
                        icon: 'success',
                        title: 'Cards Generated!',
                        text: `Added 5 new cards to your "${activeVideo?.title || "Video Study"}" deck.`,
                        confirmButtonText: 'Awesome'
                    });
                }
            }
        } catch (error) {
            console.error("Conversion error:", error);
            MindSwal.fire({
                icon: 'error',
                title: 'AI Generator Error',
                text: 'Could not generate flashcards from these notes. Please try again later.'
            });
        } finally {
            setFlashcardLoading(false);
        }
    };

    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

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
                        <div className="flex items-center gap-4">
                            <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800">
                                <button
                                    onClick={() => setActiveTab("library")}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "library" ? "bg-purple-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"}`}
                                >
                                    Video Library
                                </button>
                                <button
                                    onClick={() => setActiveTab("cards")}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "cards" ? "bg-purple-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"}`}
                                >
                                    Personal Deck
                                </button>
                            </div>
                            <button
                                onClick={() => setShowSubmitModal(true)}
                                className="hidden sm:flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Submit Content</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeVideo ? (
                            <div className="flex flex-col lg:flex-row gap-6 h-full">
                                {/* Video Player & Notes Column */}
                                <div className="flex-1 flex flex-col min-h-[400px] space-y-6">
                                    <div className="relative w-full h-0 pb-[56.25%] bg-black rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
                                        <iframe
                                            className="absolute top-0 left-0 w-full h-full"
                                            src={`https://www.youtube.com/embed/${getYouTubeId(activeVideo.link)}?autoplay=1`}
                                            title={activeVideo.title}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div >
                                    
                                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">{activeVideo.title}</h3>
                                            <div className="flex items-center mt-1 text-xs text-gray-400">
                                                <span className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded text-[10px] uppercase mr-3 border border-purple-500/20">
                                                    {activeVideo.type}
                                                </span>
                                                <span>Session started as {user?.displayName}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={handleGenerateSummary}
                                                disabled={summaryLoading}
                                                className="flex items-center gap-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                                            >
                                                <Sparkles className={`h-3.5 w-3.5 ${summaryLoading ? 'animate-spin' : ''}`} />
                                                {summaryLoading ? "Summarizing..." : "AI Summarizer"}
                                            </button>
                                            <button 
                                                onClick={handleNotesToFlashcards}
                                                disabled={flashcardLoading}
                                                className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                                            >
                                                <Wand2 className={`h-3.5 w-3.5 ${flashcardLoading ? 'animate-spin' : ''}`} />
                                                Study to Cards
                                            </button>
                                        </div>
                                    </div>

                                    {/* Notepad Section */}
                                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FileText className="h-5 w-5 text-blue-400" />
                                            <h4 className="text-sm font-bold text-white">Interactive Session Notes</h4>
                                        </div>
                                        <textarea
                                            className="w-full bg-gray-950/50 border border-gray-800 rounded-lg p-4 text-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 min-h-[200px] resize-none scrollbar-thin scrollbar-thumb-gray-800"
                                            placeholder="Jot down important points here..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </div>

                                    {/* AI Summary Section */}
                                    {aiSummary && (
                                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 animate-in slide-in-from-top-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="h-5 w-5 text-purple-400" />
                                                    <h4 className="text-sm font-bold text-white">AI Conceptual Guide</h4>
                                                </div>
                                                <button onClick={() => setAiSummary("")} className="text-gray-500 hover:text-white transition-colors">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiSummary}</ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div >
    
                                {/* Tools Column */}
                                < div className="w-full lg:w-96 flex-shrink-0 space-y-6" >
                                    <div className="p-5 bg-gray-950/50 rounded-xl border border-gray-800 shadow-lg">
                                        <h4 className="text-[10px] font-bold text-gray-500 mb-4 uppercase tracking-[0.2em]">Focus & Attention</h4>
                                        <FocusTimer />
                                    </div>
                                    <FlashcardGenerator />
                                </div >
                            </div >
                    ) : activeTab === "cards" ? (
                        <div className="max-w-4xl mx-auto py-6">
                            {!selectedDeckId ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Your Deck Kits</h3>
                                            <p className="text-sm text-gray-500">Pick a collection to start reviewing.</p>
                                        </div>
                                        <button 
                                            onClick={() => handleCreateDeck()}
                                            className="bg-gray-800 hover:bg-gray-700 text-purple-400 border border-purple-500/20 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
                                        >
                                            <Plus className="w-4 h-4" /> New Kit
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {userDecks.map((deck) => (
                                            <div
                                                key={deck.id}
                                                onClick={() => setSelectedDeckId(deck.id)}
                                                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left hover:border-purple-500/50 transition-all group cursor-pointer"
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => e.key === 'Enter' && setSelectedDeckId(deck.id)}
                                            >
                                                <div className="bg-purple-500/10 w-10 h-10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <Brain className="w-5 h-5 text-purple-500" />
                                                </div>
                                                <h4 className="text-white font-bold mb-1">{deck.title}</h4>
                                                <p className="text-xs text-gray-500 mb-4">{deck.cardCount} Cards</p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center text-[10px] font-bold text-purple-400 uppercase tracking-wider gap-1">
                                                        Open Kit <ArrowRight className="w-3 h-3" />
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleDeleteDeck(e, deck.id)}
                                                        className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-lg transition-colors"
                                                        title="Delete Kit"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {userDecks.length === 0 && (
                                            <div className="col-span-full py-20 text-center bg-gray-950 border border-dashed border-gray-800 rounded-2xl">
                                                <div className="bg-gray-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-800">
                                                    <Sparkles className="w-8 h-8 text-gray-700" />
                                                </div>
                                                <p className="text-gray-500">No decks found. Create one or clone from community!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <FlashcardGenerator 
                                    deckId={selectedDeckId} 
                                    onBack={() => setSelectedDeckId(null)} 
                                />
                            )}
                        </div>
                    ) : (
                        /* Resource List Grid */
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                            {/* Self-Study Custom URL Card */}
                            <div className="group overflow-hidden rounded-xl border border-dashed border-gray-700 bg-gray-900/30 transition-all hover:border-purple-500/50 p-6 flex flex-col justify-center items-center text-center">
                                <div className="p-3 bg-red-500/10 rounded-full mb-4">
                                    <Youtube className="h-8 w-8 text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Self-Study Session</h3>
                                <p className="text-xs text-gray-500 mb-6 max-w-[200px]">Paste any YouTube link to start an AI-assisted focus session.</p>
                                <div className="flex w-full gap-2">
                                    <input 
                                        type="text"
                                        placeholder="Paste link..."
                                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                                        value={selfStudyUrl}
                                        onChange={(e) => setSelfStudyUrl(e.target.value)}
                                    />
                                    <button
                                        onClick={() => {
                                            const id = getYouTubeId(selfStudyUrl);
                                            if (id) {
                                                setActiveVideo({
                                                    id: "temp",
                                                    title: "Custom Study Session",
                                                    link: selfStudyUrl,
                                                    type: "video",
                                                    status: "approved",
                                                    submittedBy: user?.uid || "",
                                                    submittedByName: "You"
                                                });
                                            } else {
                                                alert("Please enter a valid YouTube URL");
                                            }
                                        }}
                                        className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all"
                                    >
                                        Go
                                    </button>
                                </div>
                            </div>
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
                    )}
                </div >
            </div >

            {/* AI Tutor Chat - Desktop Sidebar */}
            <div className="hidden xl:flex w-96 flex-col rounded-xl border border-gray-800 bg-gray-900">
                <div className="border-b border-gray-800 p-4">
                    <h3 className="flex items-center font-semibold text-white">
                        <Bot className="mr-2 h-5 w-5 text-green-400" />
                        AI Tutor
                    </h3>
                </div>
                <ChatInterface messages={messages} isLoading={isLoading} input={input} setInput={setInput} handleSend={handleSend} />
            </div>

            {/* Mobile AI Tutor Toggle & Drawer */}
            <div className="xl:hidden">
                <button
                    onClick={() => setIsMobileChatOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 active:scale-95 transition-all animate-bounce"
                >
                    <Bot className="w-7 h-7" />
                </button>

                {isMobileChatOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
                        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-950">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Bot className="w-5 h-5 text-green-400" /> AI Tutor Assistant
                            </h3>
                            <button onClick={() => setIsMobileChatOpen(false)} className="bg-gray-800 p-2 rounded-lg text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 bg-gray-900 overflow-hidden">
                            <ChatInterface messages={messages} isLoading={isLoading} input={input} setInput={setInput} handleSend={handleSend} />
                        </div>
                    </div>
                )}
            </div>

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

function ChatInterface({ messages, isLoading, input, setInput, handleSend }: any) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                {messages.map((msg: any, idx: number) => (
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
                        <div className="bg-gray-800 text-gray-400 rounded-xl p-3 text-xs animate-pulse font-mono tracking-widest">
                            THINKING...
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSend} className="border-t border-gray-800 p-4 bg-gray-950/30">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        className="flex-1 rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none text-sm"
                        placeholder="Ask your tutor..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="rounded-lg bg-purple-600 p-2.5 text-white hover:bg-purple-500 disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
