"use client";

import { useEffect, useState } from "react";
import { realtimeDb } from "@/lib/firebase";
import { ref, onValue, onDisconnect, set, remove } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { User } from "lucide-react";

interface ParticipantListProps {
    roomId: string;
}

interface Participant {
    id: string;
    name: string;
    joinedAt: number;
}

export default function ParticipantList({ roomId }: ParticipantListProps) {
    const { user } = useAuth();
    const [participants, setParticipants] = useState<Participant[]>([]);

    useEffect(() => {
        if (!roomId) return;

        if (user) {
            // Register presence
            const participantRef = ref(realtimeDb, `rooms/${roomId}/participants/${user.uid}`);

            // Set user is present
            set(participantRef, {
                name: user.displayName || "Anonymous",
                joinedAt: Date.now() // client timestamp roughly ok for presence
            });

            // Remove on disconnect (navigating away or closing tab)
            onDisconnect(participantRef).remove();

            // Cleanup on unmount (SPA navigation)
            return () => {
                remove(participantRef);
            };
        }
    }, [roomId, user]);

    useEffect(() => {
        if (!roomId) return;
        const participantsRef = ref(realtimeDb, `rooms/${roomId}/participants`);
        const unsubscribe = onValue(participantsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([key, value]: [string, any]) => ({
                    id: key,
                    name: value.name,
                    joinedAt: value.joinedAt,
                }));
                setParticipants(list);
            } else {
                setParticipants([]);
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <h3 className="mb-4 font-semibold text-white flex items-center">
                <User className="mr-2 h-4 w-4 text-blue-400" />
                Participants ({participants.length})
            </h3>
            <div className="space-y-3">
                {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-xs uppercase">
                            {participant.name.slice(0, 2)}
                        </div>
                        <span className="text-sm text-gray-300 truncate">{participant.name}</span>
                        {participant.id === user?.uid && (
                            <span className="text-xs text-gray-500">(You)</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
