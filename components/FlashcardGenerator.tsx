"use client";

import { useState, useEffect } from "react";
import { Plus, X, RotateCw, Trash2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, onValue, push, remove } from "firebase/database";

interface Flashcard {
    id: string;
    front: string;
    back: string;
}

export default function FlashcardGenerator() {
    const { user } = useAuth();
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [newFront, setNewFront] = useState("");
    const [newBack, setNewBack] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch Cards from Firebase
    useEffect(() => {
        if (!user) return;

        const flashcardsRef = ref(realtimeDb, `users/${user.uid}/flashcards`);
        const unsubscribe = onValue(flashcardsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loadedCards = Object.entries(data).map(([key, val]: [string, any]) => ({
                    id: key,
                    front: val.front,
                    back: val.back
                }));
                setCards(loadedCards);
            } else {
                setCards([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleFlip = () => setIsFlipped(!isFlipped);

    const handleNext = () => {
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev + 1) % cards.length);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    };

    const addCard = async () => {
        if (!newFront.trim() || !newBack.trim() || !user) return;

        const flashcardsRef = ref(realtimeDb, `users/${user.uid}/flashcards`);
        await push(flashcardsRef, {
            front: newFront,
            back: newBack,
            createdAt: Date.now()
        });

        setNewFront("");
        setNewBack("");
        setIsAdding(false);
    };

    const deleteCard = async (id: string) => {
        if (!user) return;
        const cardRef = ref(realtimeDb, `users/${user.uid}/flashcards/${id}`);
        await remove(cardRef);

        // Adjust index if needed
        if (currentIndex >= cards.length - 1) {
            setCurrentIndex(Math.max(0, cards.length - 2));
        }
    };

    if (loading) return <div className="p-6 text-center text-gray-500">Loading flashcards...</div>;

    if (cards.length === 0 && !isAdding) {
        return (
            <div className="text-center py-10 border border-dashed border-gray-700 rounded-xl">
                <p className="text-gray-500 mb-4">No flashcards yet.</p>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                    Create First Card
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <RotateCw className="w-4 h-4 text-purple-400" />
                    Flashcards
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full text-white transition-colors border border-gray-700"
                >
                    {isAdding ? "Cancel" : "+ Add New"}
                </button>
            </div>

            {isAdding ? (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Front (Question)</label>
                        <textarea
                            className="w-full bg-gray-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                            rows={2}
                            value={newFront}
                            onChange={(e) => setNewFront(e.target.value)}
                            placeholder="e.g. What is the Virtual DOM?"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Back (Answer)</label>
                        <textarea
                            className="w-full bg-gray-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                            rows={3}
                            value={newBack}
                            onChange={(e) => setNewBack(e.target.value)}
                            placeholder="e.g. An in-memory representation of the real DOM..."
                        />
                    </div>
                    <button
                        onClick={addCard}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                        Save Card
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <div
                        onClick={handleFlip}
                        className="w-full h-48 perspective cursor-pointer group"
                    >
                        <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                            {/* Front */}
                            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 flex items-center justify-center text-center shadow-lg group-hover:border-purple-500/50 transition-colors">
                                <p className="text-lg font-medium text-white">{cards[currentIndex]?.front}</p>
                                <span className="absolute bottom-3 text-xs text-gray-500">Tap to flip</span>
                            </div>

                            {/* Back */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-purple-900/50 to-gray-900 border border-purple-500/30 rounded-xl p-6 flex items-center justify-center text-center shadow-lg">
                                <p className="text-base text-gray-200">{cards[currentIndex]?.back}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between w-full mt-6">
                        <button
                            onClick={handlePrev}
                            className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center">
                            <span className="text-sm text-gray-400 font-mono">
                                {currentIndex + 1} / {cards.length}
                            </span>
                            <button
                                onClick={() => deleteCard(cards[currentIndex].id)}
                                className="text-xs text-red-500/50 hover:text-red-500 mt-1 flex items-center gap-1"
                            >
                                <Trash2 className="w-3 h-3" /> Delete
                            </button>
                        </div>

                        <button
                            onClick={handleNext}
                            className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
