"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Users, Plus, ArrowRight, Play } from "lucide-react";
import { realtimeDb } from "@/lib/firebase";
import { ref, set, onValue, get, remove } from "firebase/database";

interface Room {
    id: string;
    name: string;
    createdBy: string;
    createdAt: number;
}

export default function RoomLobbyPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [roomId, setRoomId] = useState("");
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [inputCode, setInputCode] = useState("");
    const [error, setError] = useState("");
    const [joinError, setJoinError] = useState("");
    const [deleteError, setDeleteError] = useState("");

    const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");

    const [isCreating, setIsCreating] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");

    // Fetch active rooms
    useEffect(() => {
        const roomsRef = ref(realtimeDb, 'rooms');
        const unsubscribe = onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            const loadedRooms: Room[] = [];

            if (data) {
                const dataValues = Array.isArray(data) ? data : Object.values(data);
                dataValues.forEach((room: any) => {
                    if (room && room.id) {
                        loadedRooms.push({
                            id: room.id,
                            name: room.name || "Unnamed Room",
                            createdBy: room.createdBy,
                            createdAt: room.createdAt || Date.now()
                        });
                    }
                });
                // Sort by newest first
                loadedRooms.sort((a, b) => b.createdAt - a.createdAt);
            }
            setRooms(loadedRooms);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // --- Persistence Helpers ---
    const saveRoomToLocal = (roomId: string) => {
        if (typeof window === "undefined") return;
        const saved = JSON.parse(localStorage.getItem("joinedRooms") || "[]");
        if (!saved.includes(roomId)) {
            saved.push(roomId);
            localStorage.setItem("joinedRooms", JSON.stringify(saved));
        }
    };

    const isRoomSaved = (roomId: string) => {
        if (typeof window === "undefined") return false;
        const saved = JSON.parse(localStorage.getItem("joinedRooms") || "[]");
        return saved.includes(roomId);
    };

    const handleCreateClick = () => {
        setIsCreating(true);
        setNewRoomName(`${user?.displayName || "User"}'s Group`);
    };

    const confirmCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newRoomName.trim()) return;

        // Generate simple 6-char ID
        const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Save to DB
        try {
            await set(ref(realtimeDb, `rooms/${newRoomId}`), {
                id: newRoomId,
                name: newRoomName,
                createdBy: user.uid,
                createdAt: Date.now()
            });

            saveRoomToLocal(newRoomId); // Auto-save created room
            router.push(`/dashboard/room/${newRoomId}`);
        } catch (error) {
            console.error("Failed to create room:", error);
        }
    };

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setJoinError("");

        if (roomId.trim()) {
            const code = roomId.trim().toUpperCase();
            try {
                const snapshot = await get(ref(realtimeDb, `rooms/${code}`));
                if (snapshot.exists()) {
                    saveRoomToLocal(code); // Save on direct join
                    router.push(`/dashboard/room/${code}`);
                } else {
                    setJoinError("Invalid Room Code. Please check and try again.");
                }
            } catch (err) {
                console.error("Error validating room:", err);
                setJoinError("Error checking room code.");
            }
        }
    };

    const handleOpenClick = (room: Room) => {
        // Check if we already have the code saved
        if (isRoomSaved(room.id) || room.createdBy === user?.uid) {
            // If saved OR if I created it, join directly
            router.push(`/dashboard/room/${room.id}`);
        } else {
            // Otherwise ask for code
            setSelectedRoom(room);
            setInputCode("");
            setError("");
        }
    };

    const confirmJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRoom) return;

        if (inputCode.trim().toUpperCase() === selectedRoom.id) {
            saveRoomToLocal(selectedRoom.id); // Save on successful verification
            router.push(`/dashboard/room/${selectedRoom.id}`);
        } else {
            setError("Incorrect room code.");
        }
    };

    return (
        <div className="flex h-full flex-col p-4 md:p-6 space-y-6 md:space-y-8 relative">
            {/* ... Modals (kept same) ... */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl relative">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-white mb-2">Name Your Group</h3>
                        <p className="text-sm text-gray-400 mb-6">Give your study group a cool name!</p>

                        <form onSubmit={confirmCreateRoom} className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="e.g. Late Night Coders"
                                    className="w-full rounded-lg border border-gray-700 bg-gray-950 p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 transition-all"
                            >
                                Create & Join
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Overlay */}
            {selectedRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl relative">
                        <button
                            onClick={() => setSelectedRoom(null)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-white mb-2">Join {selectedRoom.name}</h3>
                        <p className="text-sm text-gray-400 mb-6">This room is protected. Please enter the room code to join.</p>

                        <form onSubmit={confirmJoin} className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Enter Room Code"
                                    className="w-full rounded-lg border border-gray-700 bg-gray-950 p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    value={inputCode}
                                    onChange={(e) => setInputCode(e.target.value)}
                                    autoFocus
                                />
                                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-lg bg-Purple-600 hover:bg-purple-700 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 transition-all"
                            >
                                Verify & Join
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="text-center max-w-2xl mx-auto">
                <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4">Study Rooms</h1>
                <p className="text-sm md:text-base text-gray-400">Join a collaborative space to study with friends.</p>
            </div>

            {/* Actions Grid */}
            <div className="grid gap-3 md:gap-4 lg:grid-cols-2 lg:gap-6 max-w-4xl mx-auto w-full">
                {/* Create Room */}
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 md:p-6 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10">
                    <div className="flex items-center gap-3 mb-2 md:mb-4">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <Plus className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg md:text-xl font-bold text-white">Create New Room</h2>
                    </div>
                    <p className="mb-3 md:mb-6 text-xs md:text-sm text-gray-400">Start a new study session instantly.</p>
                    <button
                        onClick={handleCreateClick}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 md:py-3 text-sm md:text-base font-semibold text-white transition-all hover:bg-blue-500"
                    >
                        Create Room
                    </button>
                </div>

                {/* Join Room */}
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 md:p-6 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10">
                    <div className="flex items-center gap-3 mb-2 md:mb-4">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                            <Users className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg md:text-xl font-bold text-white">Join Room</h2>
                    </div>
                    <p className="mb-3 md:mb-6 text-xs md:text-sm text-gray-400">Enter code to join a session.</p>
                    <form onSubmit={handleJoinRoom} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter Code"
                            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 p-2.5 md:p-3 text-sm md:text-base text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="rounded-lg bg-purple-600 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-semibold text-white transition-all hover:bg-purple-500"
                        >
                            Join
                        </button>
                    </form>
                    {joinError && <p className="text-red-400 text-xs mt-2">{joinError}</p>}
                </div>
            </div>

            {/* Active Rooms List */}
            <div className="max-w-4xl mx-auto w-full">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Active Rooms</h3>
                </div>

                {deleteError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-800 text-red-200 text-sm flex justify-between items-center">
                        <span><strong>Admin Error:</strong> {deleteError}</span>
                        <button onClick={() => setDeleteError("")} className="text-red-400 hover:text-red-200">✕</button>
                    </div>
                )}

                {loading ? (
                    <div className="text-center text-gray-500 py-10">Loading rooms...</div>
                ) : rooms.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 bg-gray-900/50 rounded-xl border border-gray-800">
                        No active rooms. Create one to get started!
                    </div>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {rooms.map((room) => (
                            <div key={room.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                                <div className="flex-1 mr-4">
                                    {editingRoomId === room.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className="flex-1 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                                            />
                                            <button
                                                onClick={async () => {
                                                    if (editingName.trim()) {
                                                        const { update } = require('firebase/database');
                                                        try {
                                                            await update(ref(realtimeDb, `rooms/${room.id}`), { name: editingName.trim() });
                                                            setEditingRoomId(null);
                                                        } catch (err) {
                                                            console.error("Rename failed", err);
                                                        }
                                                    }
                                                }}
                                                className="px-2 py-1 bg-green-900/50 hover:bg-green-800 text-green-200 rounded text-xs"
                                            >Save</button>
                                            <button
                                                onClick={() => setEditingRoomId(null)}
                                                className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs"
                                            >Cancel</button>
                                        </div>
                                    ) : (
                                        <h4 className="font-semibold text-white">{room.name}</h4>
                                    )}
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Users className="h-3 w-3" /> Private Room
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenClick(room)}
                                        className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Open <ArrowRight className="ml-2 h-4 w-4" />
                                    </button>
                                    {(user?.email === 'harshbh8112@gmail.com' || user?.email === 'harshbh20102@gmail.com') && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingRoomId(room.id);
                                                    setEditingName(room.name);
                                                }}
                                                className="px-3 py-2 bg-blue-900/50 hover:bg-blue-800/80 text-blue-200 border border-blue-800/50 rounded-lg text-sm font-medium transition-colors"
                                                title="Rename Room (Admin)"
                                            >
                                                Rename
                                            </button>
                                            <button
                                                type="button"
                                                onClick={async (e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    try {
                                                        await remove(ref(realtimeDb, `rooms/${room.id}`));
                                                        setDeleteError("");
                                                    } catch (err: any) {
                                                        console.error("Failed to delete room:", err);
                                                        setDeleteError(err.message || "Unknown error occurred while deleting.");
                                                    }
                                                }}
                                                className="px-3 py-2 bg-red-900/50 hover:bg-red-800/80 text-red-200 border border-red-800/50 rounded-lg text-sm font-medium transition-colors"
                                                title="Delete Room (Admin)"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
