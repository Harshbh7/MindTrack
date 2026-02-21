"use client";

import { useEffect, useRef } from "react";
import { Tldraw, useEditor, Editor } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useSocket } from "@/hooks/useSocket";

// Wrapper to access the editor context
function WhiteboardEditor({ roomId, userId, userName }: { roomId: string, userId: string, userName: string }) {
    const editor = useEditor();
    const { socket } = useSocket();
    const isRemoteUpdate = useRef(false);

    useEffect(() => {
        if (!editor || !socket) return;

        // Set user details
        editor.user.updateUserPreferences({
            id: userId,
            name: userName,
            color: 'blue', // Or generate a random color based on user ID
        });

        // 0. Join Room
        socket.emit("join-room", roomId, userId);

        // 1. Listen for local changes and broadcast
        const cleanupListener = editor.store.listen((update) => {
            if (isRemoteUpdate.current) return;

            const changes = update.changes;
            const changesToEmit: { added: any[], updated: any[], removed: string[] } = { added: [], updated: [], removed: [] };

            const ignoreTypes = new Set(['instance', 'camera', 'pointer', 'instance_page_state', 'instance_presence']);

            Object.values(changes.added).forEach((record: any) => {
                if (!ignoreTypes.has(record.typeName)) changesToEmit.added.push(record);
            });

            Object.values(changes.updated).forEach((record: any) => {
                const actualRecord = record[1];
                if (actualRecord && !ignoreTypes.has(actualRecord.typeName)) {
                    changesToEmit.updated.push(actualRecord);
                }
            });

            Object.values(changes.removed).forEach((record: any) => {
                if (!ignoreTypes.has(record.typeName)) changesToEmit.removed.push(record.id);
            });

            if (changesToEmit.added.length || changesToEmit.updated.length || changesToEmit.removed.length) {
                socket.emit("whiteboard-draw", { roomId, data: changesToEmit });
            }
        }, { source: 'user', scope: 'document' });

        // 2. Listen for remote changes
        socket.on("whiteboard-update", (changes: any) => {
            isRemoteUpdate.current = true;
            try {
                editor.store.mergeRemoteChanges(() => {
                    if (changes.added && changes.added.length > 0) {
                        editor.store.put(changes.added);
                    }
                    if (changes.updated && changes.updated.length > 0) {
                        editor.store.put(changes.updated);
                    }
                    if (changes.removed && changes.removed.length > 0) {
                        editor.store.remove(changes.removed);
                    }
                });
            } catch (e) {
                console.error("Sync error:", e);
            } finally {
                isRemoteUpdate.current = false;
            }
        });

        // 3. State Recovery (Initial Sync)
        socket.emit("request-canvas-state", { roomId });

        socket.on("client-request-canvas-state", ({ requesterId }: { requesterId: string }) => {
            const ignoreTypes = new Set(['instance', 'camera', 'pointer', 'instance_page_state', 'instance_presence']);
            const allRecords = editor.store.allRecords();
            const documentRecords = allRecords.filter((record: any) => !ignoreTypes.has(record.typeName));

            if (documentRecords.length > 0) {
                socket.emit("send-canvas-state", { roomId, state: documentRecords, requesterId });
            }
        });

        socket.on("canvas-state-response", (documentRecords: any[]) => {
            if (!documentRecords || documentRecords.length === 0) return;
            isRemoteUpdate.current = true;
            try {
                editor.store.mergeRemoteChanges(() => {
                    editor.store.put(documentRecords);
                });
            } catch (e) {
                console.error("Failed to load initial state", e);
            } finally {
                isRemoteUpdate.current = false;
            }
        });

        return () => {
            cleanupListener();
            socket.off("whiteboard-update");
            socket.off("client-request-canvas-state");
            socket.off("canvas-state-response");
        };
    }, [editor, socket, roomId, userId, userName]);

    return null;
}

export default function Whiteboard({ roomId, userId = "guest", userName = "Guest" }: { roomId?: string, userId?: string, userName?: string }) {
    if (!roomId) roomId = "demo-room";

    return (
        <div className="w-full h-full relative rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
            <Tldraw persistenceKey={`room-${roomId}`}>
                <WhiteboardEditor roomId={roomId} userId={userId} userName={userName} />
            </Tldraw>
        </div>
    );
}
