"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { realtimeDb } from "@/lib/firebase";
import { ref, push, onValue, serverTimestamp, query, orderByChild, limitToLast } from "firebase/database";
import { Send, User } from "lucide-react";


interface ChatProps {
    roomId: string;
}

interface Message {
    id: string;
    text: string;
    userId: string;
    userName: string;
    timestamp: number;
}

export default function Chat({ roomId }: ChatProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState("Connecting...");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!roomId) {
            setConnectionStatus("No Room ID");
            return;
        }

        console.log("Chat initializing for room:", roomId);
        const messagesRef = query(ref(realtimeDb, `rooms/${roomId}/messages`), limitToLast(100));

        const unsubscribe = onValue(messagesRef, (snapshot) => {
            setConnectionStatus("Connected");
            const data = snapshot.val();
            if (data) {
                const messageList = Object.entries(data).map(([key, value]: [string, any]) => ({
                    id: key,
                    ...value,
                }));
                messageList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                setMessages(messageList);
            } else {
                setMessages([]);
            }
        }, (error) => {
            console.error("Firebase Read Error:", error);
            setConnectionStatus("Error: " + error.message);
            if (error.message.includes("permission_denied")) {
                alert("Permission Denied: Check Firebase Rules.");
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            alert("You must be logged in to chat.");
            return;
        }
        if (!newMessage.trim()) return;

        setIsSending(true);
        try {
            console.log("Sending message...", newMessage);
            const messagesRef = ref(realtimeDb, `rooms/${roomId}/messages`);
            await push(messagesRef, {
                text: newMessage,
                userId: user.uid,
                userName: user.displayName || "Anonymous",
                timestamp: serverTimestamp(),
            });
            console.log("Message sent successfully");
            setNewMessage("");
        } catch (error: any) {
            console.error("Error sending message:", error);
            alert("Failed to send: " + error.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex h-full flex-col rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
            <div className="border-b border-gray-800 p-4 flex justify-between items-center">
                <h3 className="font-semibold text-white">Room Chat</h3>
                <div className="flex items-center space-x-2">
                    <span className={`h-2 w-2 rounded-full ${connectionStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-xs text-gray-400">{connectionStatus}</span>
                </div>
            </div>




            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm mt-10">
                        No messages yet. Say hi! 👋
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.userId === user?.uid;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] rounded-xl p-3 ${isMe ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-200"}`}>
                                {!isMe && <p className="mb-1 text-xs text-blue-400 font-bold">{msg.userName}</p>}
                                <p className="text-sm">{msg.text}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="border-t border-gray-800 p-4">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        className="flex-1 rounded-lg border border-gray-700 bg-gray-800 p-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                        placeholder={isSending ? "Sending..." : "Type a message..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={isSending || !newMessage.trim()}
                        className={`rounded-lg p-2 text-white transition-colors ${isSending || !newMessage.trim() ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
