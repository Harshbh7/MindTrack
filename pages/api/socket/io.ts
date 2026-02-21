import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponse } from "next";

export type NextApiResponseServerIO = NextApiResponse & {
    socket: any & {
        server: NetServer & {
            io: ServerIO;
        };
    };
};

export const config = {
    api: {
        bodyParser: false,
    },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
    if (!res.socket.server.io) {
        const path = "/api/socket/io";
        const httpServer: NetServer = res.socket.server as any;
        const io = new ServerIO(httpServer, {
            path: path,
            addTrailingSlash: false,
        });

        io.on("connection", (socket) => {
            console.log("Socket connected:", socket.id);

            socket.on("join-room", (roomId, userId) => {
                socket.join(roomId);
                console.log(`User ${userId} joined room ${roomId}`);
                socket.to(roomId).emit("user-connected", userId);
            });

            socket.on("call-user", (data) => {
                const { userToCall, signalData, from, name } = data;
                console.log(`Call from ${from} to ${userToCall}`);
                socket.to(userToCall).emit("call-made", { signal: signalData, from, name });
                // Also broadcast to room just in case, or handle logic appropriately. 
                // For 1:1 in room, broadcasting to room except sender is easier if we don't track socketId <-> userId tightly
                // But better to use the room mechanism.
                // Let's assume 'userToCall' is arguably the roomId if we are doing room-based calling, 
                // OR we need to map users. 
                // Simplest for now: Broadcast 'call-made' to the room, and let clients filter if it's for them, or just ring everyone (group call style start, but simple-peer is p2p 1:1 usually).
                // Let's stick to the plan: 1:1 call initiated within a room.
                // Actually, for a simple implementation within a chat room, usually we broadcast "someone is calling" to the room.
                // But the prompt implied 1:1 or group. Let's aim for 1:1 signaling first.
                // If 'userToCall' is passed, we need a way to send to that specific USER.
                // Since we don't have a user->socket map, we can rely on joining the room. 
                // If we emit to the room, everyone receives it. 
                // Let's change event to "signal" to be more generic or specific events.

                // Re-thinking: In a room, User A calls. 
                // If we want to call a specific person, we need their socket ID or we broadcast to room "I want to call User B".
                // Let's assume we broadcast call signals to the room.
            });

            // Better approach for simple-peer in a room:
            socket.on("signal", (data) => {
                // data: { userToSignal, signal, callerId }
                // We can't easily target a specific socket without mapping. 
                // But we can broadcast to the room and let the client decide "Is this for me?" if we include targetUserId.
                const { roomId, signal, targetUserId } = data;
                if (roomId) {
                    socket.to(roomId).emit("signal", { signal, fromUserId: data.userId, targetUserId });
                }
            });

            // But let's stick to standard "callUser", "answerCall", "iceCandidate" for clarity

            socket.on("initiate-call", ({ roomId, signalData, fromUserId, fromUserName }) => {
                // Notify others in room
                socket.to(roomId).emit("incoming-call", { signal: signalData, from: fromUserId, name: fromUserName });
            });

            socket.on("answer-call", ({ roomId, signal, toUserId }) => {
                // We broadcast to room, looking for the caller? Or we prefer targeted?
                // Targeted is better. But without mapping, we broadcast.
                socket.to(roomId).emit("call-accepted", { signal, toUserId }); // 'toUserId' is the person who CALLED originally
            });

            socket.on("leave-call", ({ roomId }) => {
                socket.to(roomId).emit("call-ended");
            });

            // Whiteboard Sync
            socket.on("whiteboard-draw", ({ roomId, data }) => {
                console.log(`[io.ts] whiteboard-draw in room ${roomId}. Data size: ${JSON.stringify(data).length}`);
                socket.to(roomId).emit("whiteboard-update", data);
            });

            // Whiteboard State Recovery (for new joiners)
            socket.on("request-canvas-state", ({ roomId }) => {
                console.log(`[io.ts] request-canvas-state for room ${roomId} from ${socket.id}`);
                socket.to(roomId).emit("client-request-canvas-state", { requesterId: socket.id });
            });

            socket.on("send-canvas-state", ({ roomId, state, requesterId }) => {
                console.log(`[io.ts] send-canvas-state in room ${roomId} to ${requesterId}`);
                socket.to(requesterId).emit("canvas-state-response", state);
            });
        });

        res.socket.server.io = io;
    }
    res.end();
};

export default ioHandler;
