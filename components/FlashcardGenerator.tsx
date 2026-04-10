import { useState, useEffect, useCallback } from "react";
import { Plus, X, RotateCw, Trash2, Brain, Sparkles, Wand2, Share2, Mic, MicOff, Volume2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, onValue, push, remove, update, set } from "firebase/database";
import { MindSwal, Toast } from "@/lib/swal";

interface Flashcard {
    id: string;
    front: string;
    back: string;
    interval?: number;
    repetition?: number;
    efactor?: number;
    nextReviewDate?: number;
}

interface FlashcardGeneratorProps {
    deckId?: string;
    onBack?: () => void;
}

export default function FlashcardGenerator({ deckId, onBack }: FlashcardGeneratorProps) {
    const { user } = useAuth();
    const [allCards, setAllCards] = useState<Flashcard[]>([]);
    const [dueCards, setDueCards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    
    // Add logic
    const [newFront, setNewFront] = useState("");
    const [newBack, setNewBack] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [isAIGenerating, setIsAIGenerating] = useState(false);
    const [aiInput, setAiInput] = useState("");
    const [isAILoading, setIsAILoading] = useState(false);
    const [loading, setLoading] = useState(true);

    // Voice Assistant State
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // Fetch Cards from Firebase
    useEffect(() => {
        if (!user) return;

        // Path logic: users/{uid}/decks/{deckId}/cards OR users/{uid}/flashcards (legacy)
        const path = deckId 
            ? `users/${user.uid}/decks/${deckId}/cards` 
            : `users/${user.uid}/flashcards`;

        const flashcardsRef = ref(realtimeDb, path);
        const unsubscribe = onValue(flashcardsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loaded = Object.entries(data).map(([key, val]: [string, any]) => ({
                    id: key,
                    ...val
                }));
                setAllCards(loaded);
                
                const now = Date.now();
                // Filter ones that are due
                const due = loaded.filter(c => !c.nextReviewDate || c.nextReviewDate <= now);
                setDueCards(due);
            } else {
                setAllCards([]);
                setDueCards([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, deckId]);

    // Handle out of bounds if array shrinks
    useEffect(() => {
        if (currentIndex >= dueCards.length) {
            setCurrentIndex(Math.max(0, dueCards.length - 1));
        }
    }, [dueCards.length, currentIndex]);

    const handleFlip = useCallback(() => setIsFlipped(!isFlipped), [isFlipped]);

    const speak = (text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const handleGrade = async (quality: number) => {
        if (!user) return;
        const card = dueCards[currentIndex];
        
        // SuperMemo-2 Calculations
        const repetition = card.repetition || 0;
        const efactor = card.efactor || 2.5;
        const interval = card.interval || 0;

        let newEfactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (newEfactor < 1.3) newEfactor = 1.3;

        let newRepetition = repetition;
        let newInterval = interval;

        if (quality >= 3) {
            if (repetition === 0) {
                newInterval = 1;
            } else if (repetition === 1) {
                newInterval = 6;
            } else {
                newInterval = Math.round(interval * newEfactor);
            }
            newRepetition++;
        } else {
            newRepetition = 0;
            newInterval = 1;
        }

        const ONE_DAY = 24 * 60 * 60 * 1000;
        const nextReviewDate = Date.now() + (newInterval * ONE_DAY);

        const path = deckId 
            ? `users/${user.uid}/decks/${deckId}/cards/${card.id}` 
            : `users/${user.uid}/flashcards/${card.id}`;

        const cardRef = ref(realtimeDb, path);
        await update(cardRef, {
            interval: newInterval,
            repetition: newRepetition,
            efactor: newEfactor,
            nextReviewDate
        });

        setIsFlipped(false);
        if (currentIndex < dueCards.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    // Voice Command Logic
    useEffect(() => {
        if (!isVoiceMode || !window.hasOwnProperty('webkitSpeechRecognition')) return;

        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => {
             if (isVoiceMode) recognition.start(); // Keep listening
             else setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript.toLowerCase();
            console.log("Voice Command:", command);

            if (command.includes("flip") || command.includes("reveal")) {
                handleFlip();
            } else if (command.includes("next")) {
                if (currentIndex < dueCards.length - 1) setCurrentIndex(prev => prev + 1);
            } else if (command.includes("easy")) {
                handleGrade(5);
            } else if (command.includes("good")) {
                handleGrade(4);
            } else if (command.includes("hard")) {
                handleGrade(3);
            } else if (command.includes("again")) {
                handleGrade(1);
            }
        };

        recognition.start();
        return () => recognition.stop();
    }, [isVoiceMode, handleFlip, handleGrade, currentIndex, dueCards.length]);

    // Speak card on change
    useEffect(() => {
        if (isVoiceMode && dueCards[currentIndex]) {
            speak(isFlipped ? "Answer: " + dueCards[currentIndex].back : "Question: " + dueCards[currentIndex].front);
        }
    }, [currentIndex, isFlipped, isVoiceMode, dueCards]);

    const addCard = async () => {
        if (!newFront.trim() || !newBack.trim() || !user) return;

        const path = deckId 
            ? `users/${user.uid}/decks/${deckId}/cards` 
            : `users/${user.uid}/flashcards`;

        const flashcardsRef = ref(realtimeDb, path);
        await push(flashcardsRef, {
            front: newFront,
            back: newBack,
            createdAt: Date.now(),
            interval: 0,
            repetition: 0,
            efactor: 2.5,
            nextReviewDate: Date.now() // Due immediately
        });

        setNewFront("");
        setNewBack("");
        setIsAdding(false);
    };

    const handleAIGenerate = async () => {
        if (!aiInput.trim() || !user) return;
        setIsAILoading(true);

        try {
            const res = await fetch('/api/ai/flashcards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: aiInput, count: 5 })
            });

            const data = await res.json();
            if (data.flashcards) {
                const path = deckId 
                    ? `users/${user.uid}/decks/${deckId}/cards` 
                    : `users/${user.uid}/flashcards`;
                const flashcardsRef = ref(realtimeDb, path);
                
                // Batch add
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
                
                setAiInput("");
                setIsAIGenerating(false);
                Toast.fire({
                    icon: 'success',
                    title: `Generated ${data.flashcards.length} cards!`
                });
            }
        } catch (error) {
            console.error("AI Gen error:", error);
            MindSwal.fire({
                icon: 'error',
                title: 'Generation Failed',
                text: 'Could not generate cards. Please check your API key or input.'
            });
        } finally {
            setIsAILoading(false);
        }
    };

    const deleteCard = async (id: string) => {
        if (!user) return;
        const path = deckId 
            ? `users/${user.uid}/decks/${deckId}/cards/${id}` 
            : `users/${user.uid}/flashcards/${id}`;
        const cardRef = ref(realtimeDb, path);
        await remove(cardRef);
    };

    const handlePublishToCommunity = async () => {
        if (!user || allCards.length < 3) {
            alert("Please add at least 3 cards to your deck before publishing.");
            return;
        }

        const title = prompt("Enter a title for your Community Deck:", "My Awesome Deck");
        if (!title) return;

        try {
            const communityRef = ref(realtimeDb, 'communityDecks');
            await push(communityRef, {
                title,
                author: user.displayName || "Anonymous",
                authorUid: user.uid,
                cards: allCards,
                downloads: 0,
                createdAt: Date.now()
            });
            MindSwal.fire({
                icon: 'success',
                title: 'Published!',
                text: 'Deck published successfully to the community! 🚀'
            });
        } catch (error) {
            console.error("Publish error:", error);
            Toast.fire({
                icon: 'error',
                title: 'Failed to publish deck'
            });
        }
    };

    if (loading) return <div className="p-6 text-center text-gray-500">Loading flashcards...</div>;

    if (allCards.length === 0 && !isAdding) {
        return (
            <div className="text-center py-10 border border-dashed border-gray-700 rounded-xl bg-gray-900 border-gray-800 p-6">
                <Brain className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">You don't have any flashcards.</p>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                    Create First Card
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <RotateCw className="w-4 h-4 text-purple-400" />
                        {deckId ? "Reviewing Kit" : "All Flashcards"}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
                        {dueCards.length} Due
                    </span>
                    <button
                        onClick={() => setIsAIGenerating(!isAIGenerating)}
                        className="text-xs bg-purple-600/20 hover:bg-purple-600/30 px-3 py-1 rounded-full text-purple-400 transition-colors border border-purple-500/30 flex items-center gap-1"
                    >
                        <Sparkles className="w-3 h-3" /> AI Gen
                    </button>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full text-white transition-colors border border-gray-700"
                    >
                        {isAdding ? "Cancel" : "+ Add New"}
                    </button>
                    {allCards.length > 0 && (
                        <button
                            onClick={async () => {
                                const result = await MindSwal.fire({
                                    title: 'Publish Deck?',
                                    text: 'Everyone in the community will see your cards.',
                                    icon: 'question',
                                    showCancelButton: true,
                                    confirmButtonText: 'Yes, Publish'
                                });
                                
                                if (result.isConfirmed) {
                                    const communityRef = ref(realtimeDb, `communityDecks`);
                                    await push(communityRef, {
                                        author: user?.displayName || user?.email,
                                        authorUid: user?.uid,
                                        title: `${user?.displayName || "User"}'s Study Deck`,
                                        cards: allCards,
                                        downloads: 0,
                                        createdAt: Date.now()
                                    });
                                    Toast.fire({
                                        icon: 'success',
                                        title: 'Deck published successfully!'
                                    });
                                }
                            }}
                            className="text-xs bg-green-600/20 hover:bg-green-600/30 px-3 py-1 rounded-full text-green-400 transition-colors border border-green-500/30"
                        >
                            Publish
                        </button>
                    )}
                </div>
            </div>

            {isAIGenerating && (
                <div className="mb-6 space-y-4 animate-in slide-in-from-top-2 p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-purple-400 flex items-center gap-2">
                            <Wand2 className="w-4 h-4" /> AI Flashcard Creator
                        </label>
                        <button onClick={() => setIsAIGenerating(false)} className="text-gray-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <textarea
                        className="w-full bg-gray-800/50 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 border border-gray-700"
                        rows={4}
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        placeholder="Paste your study notes or a paragraph here, and I'll create flashcards for you..."
                    />
                    <button
                        onClick={handleAIGenerate}
                        disabled={isAILoading || !aiInput.trim()}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAILoading ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" /> Generate 5 Cards
                            </>
                        )}
                    </button>
                    <p className="text-[10px] text-gray-500 text-center italic">Powered by Google Gemini AI</p>
                </div>
            )}

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
            ) : dueCards.length === 0 ? (
                <div className="text-center py-10 border border-gray-800 rounded-xl bg-gray-950">
                    <Brain className="w-8 h-8 text-green-500 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">You're all caught up!</p>
                    <p className="text-xs text-gray-500">Check back tomorrow for more reviews.</p>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <div
                        onClick={handleFlip}
                        className="w-full h-48 perspective cursor-pointer group"
                    >
                        <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                            {/* Front */}
                            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg group-hover:border-purple-500/50 transition-colors">
                                <p className="text-lg font-medium text-white">{dueCards[currentIndex]?.front}</p>
                                <span className={`mt-4 text-xs ${isFlipped ? 'text-transparent' : 'text-purple-400 font-semibold animate-pulse'}`}>
                                    Tap to reveal answer
                                </span>
                            </div>

                            {/* Back */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-purple-900/50 to-gray-900 border border-purple-500/30 rounded-xl p-6 flex items-center justify-center text-center shadow-lg overflow-y-auto">
                                <p className="text-base text-gray-200">{dueCards[currentIndex]?.back}</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full mt-6">
                        {isFlipped ? (
                            <div className="flex gap-2 w-full animate-in slide-in-from-bottom-2">
                                <button onClick={() => handleGrade(1)} className="flex-1 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-semibold transition-colors">Again</button>
                                <button onClick={() => handleGrade(3)} className="flex-1 py-2 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg text-sm font-semibold transition-colors">Hard</button>
                                <button onClick={() => handleGrade(4)} className="flex-1 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-sm font-semibold transition-colors">Good</button>
                                <button onClick={() => handleGrade(5)} className="flex-1 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-sm font-semibold transition-colors">Easy</button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center w-full">
                                <button
                                    onClick={() => deleteCard(dueCards[currentIndex].id)}
                                    className="text-xs text-red-500/50 hover:text-red-500 flex items-center gap-1 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" /> Delete
                                </button>
                                
                                <button
                                    onClick={() => setIsVoiceMode(!isVoiceMode)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${isVoiceMode ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 animate-pulse' : 'bg-gray-800 text-gray-500 border-gray-700'}`}
                                >
                                    {isVoiceMode ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                                    {isVoiceMode ? "Voice Assistant: ON" : "Voice Assistant: OFF"}
                                </button>

                                <span className="text-sm text-gray-400 font-mono">
                                    {currentIndex + 1} / {dueCards.length}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
