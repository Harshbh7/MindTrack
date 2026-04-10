const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Explicit CORS middleware for Express
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"]
}));

// Health Check Route
app.get('/', (req, res) => {
    res.send('Socket Server is Running! 🚀');
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins
        methods: ["GET", "POST"],
        credentials: false // Disable cookies/sessions for simpler CORS
    },
    allowEIO3: true, // Allow older clients (compatibility mode)
    transports: ['polling', 'websocket'] // Explicitly allow both
});

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        console.log(`User ${userId} joined room ${roomId}`);
        socket.to(roomId).emit("user-connected", userId);
    });

    socket.on("initiate-call", ({ roomId, signalData, fromUserId, fromUserName }) => {
        console.log(`[io] initiate-call in room ${roomId} from ${fromUserId}`);
        socket.to(roomId).emit("incoming-call", { signal: signalData, from: fromUserId, name: fromUserName });
    });

    socket.on("answer-call", ({ roomId, signal, toUserId }) => {
        console.log(`[io] answer-call in room ${roomId} for ${toUserId}`);
        socket.to(roomId).emit("call-accepted", { signal, toUserId });
    });

    socket.on("leave-call", ({ roomId }) => {
        socket.to(roomId).emit("call-ended");
    });

    // Whiteboard Sync
    socket.on("whiteboard-draw", ({ roomId, data }) => {
        socket.to(roomId).emit("whiteboard-update", data);
    });

    // Whiteboard State Recovery
    socket.on("request-canvas-state", ({ roomId }) => {
        console.log(`[io] request-canvas-state for room ${roomId} from ${socket.id}`);
        socket.to(roomId).emit("client-request-canvas-state", { requesterId: socket.id });
    });

    socket.on("send-canvas-state", ({ roomId, state, requesterId }) => {
        console.log(`[io] send-canvas-state in room ${roomId} to ${requesterId}`);
        socket.to(requesterId).emit("canvas-state-response", state);
    });

    // Configurable signal event for simple-peer
    socket.on("signal", (data) => {
        const { roomId, signal, targetUserId } = data;
        if (roomId) {
            socket.to(roomId).emit("signal", { signal, fromUserId: data.userId, targetUserId });
        }
    });

    // Collaborative Notes Sync
    socket.on("note-change", ({ roomId, content }) => {
        socket.to(roomId).emit("note-update", content);
    });

    // Shared Pomodoro Timer Sync
    socket.on("timer-action", ({ roomId, action, seconds, mode }) => {
        const isActive = action === "start";
        socket.to(roomId).emit("timer-update", { seconds, isActive, mode });
    });

    // --- Focus Battle / Gamification ---
    // In a real app, state should be on server. Here we relay events.
    socket.on("join-battle", (roomId, userId) => {
        socket.join(roomId);
        console.log(`User ${userId} joined battle ${roomId}`);
    });

    socket.on("take-damage", ({ roomId, userId, damage }) => {
        // Broadcast damage to everyone else so they see opponent HP drop
        socket.to(roomId).emit("opponent-damage", { userId, damage });
    });

    socket.on("battle-won", ({ roomId, winnerId }) => {
        socket.to(roomId).emit("game-over", { winnerId });
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
});
