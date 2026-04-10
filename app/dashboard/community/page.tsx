"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, onValue, push, set, increment, update } from "firebase/database";
import { Globe, Download, User, Calendar, Search, Sparkles } from "lucide-react";
import { MindSwal, Toast } from "@/lib/swal";

interface CommunityDeck {
    id: string;
    author: string;
    authorUid: string;
    title: string;
    cards: any[];
    downloads: number;
    createdAt: number;
    isFeatured?: boolean;
}

const FEATURED_DECKS: CommunityDeck[] = [
    {
        id: "feat-1",
        title: "React Hooks Essentials",
        author: "MindTrack Admin",
        authorUid: "admin",
        downloads: 1250,
        createdAt: Date.now(),
        isFeatured: true,
        cards: [
            { front: "What does useEffect do?", back: "It allows you to perform side effects in function components." },
            { front: "What is the primary rule of Hooks?", back: "Only call hooks at the top level. Don't call them in loops, conditions, or nested functions." },
            { front: "What does useMemo return?", back: "A memoized value that only changes when dependencies change." }
        ]
    },
    {
        id: "feat-2",
        title: "Modern JavaScript (ES6+)",
        author: "JS Guru",
        authorUid: "jsguru",
        downloads: 840,
        createdAt: Date.now(),
        isFeatured: true,
        cards: [
            { front: "Difference between let and const?", back: "let allows re-assignment, while const creates a read-only reference." },
            { front: "What is destructuring?", back: "A syntax that allows unpacking values from arrays or properties from objects into distinct variables." }
        ]
    },
    {
        id: "feat-3",
        title: "Python 101: Basics",
        author: "PyTutor",
        authorUid: "pytutor",
        downloads: 620,
        createdAt: Date.now(),
        isFeatured: true,
        cards: [
            { front: "How to define a list in Python?", back: "Using square brackets, e.g., my_list = [1, 2, 3]" },
            { front: "What is a dictionary?", back: "A collection of key-value pairs where keys must be unique." }
        ]
    }
];

export default function CommunityPage() {
    const { user } = useAuth();
    const [decks, setDecks] = useState<CommunityDeck[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const communityRef = ref(realtimeDb, `communityDecks`);
        const unsub = onValue(communityRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([key, val]: [string, any]) => ({
                    id: key,
                    ...val
                }));
                setDecks(list.sort((a, b) => b.createdAt - a.createdAt));
            }
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const handleClone = async (deck: CommunityDeck) => {
        if (!user) return;
        
        const result = await MindSwal.fire({
            title: 'Clone Deck?',
            text: `Do you want to add "${deck.title}" to your collection?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Clone it'
        });

        if (!result.isConfirmed) return;

        try {
            // Create a new deck entry
            const userDecksRef = ref(realtimeDb, `users/${user.uid}/decks`);
            const newDeckRef = push(userDecksRef);
            const newDeckId = newDeckRef.key;

            const cardsObj: any = {};
            deck.cards.forEach((card, idx) => {
                const cardId = `c${Date.now()}_${idx}`;
                cardsObj[cardId] = {
                    front: card.front,
                    back: card.back,
                    createdAt: Date.now(),
                    interval: 0,
                    repetition: 0,
                    efactor: 2.5,
                    nextReviewDate: Date.now()
                };
            });

            await set(newDeckRef, {
                title: deck.title,
                createdAt: Date.now(),
                cards: cardsObj
            });

            // Increment download count
            const sharedDeckRef = ref(realtimeDb, `communityDecks/${deck.id}`);
            await update(sharedDeckRef, {
                downloads: increment(1)
            });
            
            Toast.fire({
                icon: 'success',
                title: 'Deck cloned successfully! 📂'
            });
        } catch (error) {
            console.error("Clone error:", error);
            Toast.fire({
                icon: 'error',
                title: 'Failed to clone deck'
            });
        }
    };

    const handleDeleteSharedDeck = async (deckId: string) => {
        const result = await MindSwal.fire({
            title: 'Are you sure?',
            text: "This deck will be removed from the community section.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it'
        });

        if (!result.isConfirmed) return;

        try {
            await set(ref(realtimeDb, `communityDecks/${deckId}`), null);
            Toast.fire({
                icon: 'success',
                title: 'Deck removed from community.'
            });
        } catch (error) {
            console.error("Delete error:", error);
            Toast.fire({
                icon: 'error',
                title: 'Failed to delete deck'
            });
        }
    };

    const handleEditSharedDeck = async (deck: CommunityDeck) => {
        const { value: newTitle } = await MindSwal.fire({
            title: 'Edit Deck Title',
            input: 'text',
            inputValue: deck.title,
            showCancelButton: true,
            inputValidator: (value) => {
              if (!value) return 'Title cannot be empty!';
              return null;
            }
        });

        if (!newTitle || newTitle === deck.title) return;
        
        try {
            await update(ref(realtimeDb, `communityDecks/${deck.id}`), { title: newTitle });
            Toast.fire({
                icon: 'success',
                title: 'Title updated!'
            });
        } catch (error) {
            console.error("Edit error:", error);
            Toast.fire({
                icon: 'error',
                title: 'Failed to update title'
            });
        }
    };

    const allDecks = [...FEATURED_DECKS, ...decks];

    const filteredDecks = allDecks.filter(d => 
        (d.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (d.author?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    );

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-400">Loading community decks...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Globe className="w-8 h-8 text-green-400" />
                        Community Decks
                    </h1>
                    <p className="text-gray-400 mt-1">Discover and clone shared study materials from the community.</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Search decks or authors..."
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            {filteredDecks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-900/50 border border-dashed border-gray-800 rounded-3xl">
                    <Sparkles className="h-12 w-12 text-gray-700 mb-4" />
                    <p className="text-gray-500 text-lg">No decks found matching your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDecks.map((deck) => (
                        <div key={deck.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-green-500/30 transition-all group flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-400 transition-colors flex items-center justify-between">
                                    <span className="truncate mr-2">{deck.title}</span>
                                    {deck.isFeatured && (
                                        <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20 whitespace-nowrap">Featured</span>
                                    )}
                                </h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded-full border border-green-500/20">
                                        {deck.cards.length} Cards
                                    </span>
                                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full border border-blue-500/20">
                                        {deck.downloads} Downloads
                                    </span>
                                </div>
                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <User className="h-3 w-3" />
                                        <span>By {deck.author}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Calendar className="h-3 w-3" />
                                        <span>Shared on {new Date(deck.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleClone(deck)}
                                    className="flex-1 bg-gray-800 hover:bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <Download className="h-4 w-4" />
                                    Clone
                                </button>
                                {user && deck.authorUid === user.uid && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditSharedDeck(deck)}
                                            className="p-2.5 bg-gray-800 hover:bg-blue-600 text-white rounded-xl transition-all"
                                            title="Edit Title"
                                        >
                                            <Calendar className="h-4 w-4" /> 
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSharedDeck(deck.id)}
                                            className="p-2.5 bg-gray-800 hover:bg-red-600 text-white rounded-xl transition-all"
                                            title="Delete Shared Deck"
                                        >
                                            <Globe className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
