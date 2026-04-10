<div align="center">

# 🧠 MindTrack: The Cyber-Premium Study Ecosystem

### AI-Driven • Real-time • High-Performance

**MindTrack is a unified premium ecosystem designed to gamify, track, and optimize every second of your learning journey.**

[![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.3-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-11.9.0-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.0-ff69b4?style=for-the-badge&logo=framer)](https://www.framer.com/motion/)

</div>

---

## 🚀 Vision
**MindTrack** is not just a productivity app; it's a "Study OS" built with a Cyber-Dark glassmorphic aesthetic. It combines **Computer Vision**, **AI Tutoring**, and **Real-time Collaboration** to create a focused and rewarding study environment.

---

## 📦 Core Modules

### 🏠 1. Central Command Dashboard
The hub of your productivity data.
- **Activity Heatmap**: Visual GitHub-style contribution calendar for study sessions.
- **Real-time Stats**: Track total focus hours, active streaks, and current XP levels.
- **Micro-Widgets**: Floating widgets for Daily Quests, Music, and quick task management.
- **Weekly Trends**: Bar charts visualizing focus duration across the last 7 days.

### ⏱️ 2. AI Focus Timer (Neural tracking)
The core engine of focus enforcement.
- **Face-Tracking AI**: Uses `face-api.js` to ensure you are physically present.
- **Gaze Verification**: Detects if your eyes are closed or if you are looking away from the screen.
- **Auto-Pause/Resume**: Instantly halts study time the moment you lose focus.
- **Emotion Recognition**: Analyzes your mood (Happy, Focused, Sad) during the session for the post-study report.

### 💻 3. Coding Arena (Cyber-IDE)
A premium development environment for learning to code.
- **MindTrack Vision Theme**: A custom glassmorphic Monaco theme optimized for low-eye strain.
- **AI Reviewer**: One-click code analysis powered by Gemini 2.5 Flash to find bugs and optimize logic.
- **Live Preview**: Integrated auto-run environment for real-time code execution visualization.
- **Persistence**: Local storage integration ensures your snippets are saved across sessions.

### 🎯 4. Focus Board (Project Management)
A high-end Kanban board for organizing your learning path.
- **Priority Matrix**: Tasks sorted by **High**, **Medium**, and **Low** impact.
- **Drag-and-Drop**: Smooth, animated task transitions powered by `@hello-pangea/dnd`.
- **Firebase Sync**: Updates reflect instantly across all your devices.
- **Glassmorphic UI**: Ultra-clean translucent cards and vibrant priority markers.

### 🧬 5. Learning Lab (SRS & AI Tutor)
A science-backed space for memory retention.
- **SRS Flashcards**: Implementations of the SM-2 algorithm for spaced repetition learning.
- **AI Personalized Tutor**: A dedicated chat assistant that understands your learning resources.
- **Resource Management**: Submit and organize PDFs, Video links, and articles.
- **Spaced Review Engine**: Automatically schedules card reviews to optimize long-term memory.

### ⚡ 6. MindTrack Sync (Collaborative Notes)
Real-time shared documentation with high-fidelity output.
- **WebSocket Sync**: Multi-user real-time editing with sub-millisecond latency.
- **Interactive Toolbar**: Formatting tools for Bold, Italic, Headings, and Code blocks.
- **Markdown Preview**: Professional-grade typography and CSS rendering for high-quality note-taking.
- **Presence Tracking**: Live indicators showing who is currently editing.

### 🌐 7. Collaborative Study Rooms
Private, synchronized virtual spaces for group study.
- **WebRTC Video/Audio**: Peer-to-peer high-quality video calling via `simple-peer`.
- **Shared Whiteboard**: Infinite canvas powered by `tldraw` for collaborative diagramming.
- **Sync-Timer**: A global Pomodoro timer that synchronizes state across all room members.
- **Room Chat**: Real-time communication during sessions.

### 🗺️ 8. AI Roadmap Generator
Mapping your path to mastery.
- **Goal Mapping**: Input any topic (e.g., "Master React"), and the AI generates a step-by-step path.
- **Progress Tracking**: Mark roadmap phases as completed as you learn.
- **Time Estimates**: AI-calculated durations for each learning phase.

### 📈 9. Emotional Analytics
Data-driven self-awareness.
- **Mood Trends**: View how your emotional state fluctuates during long study sessions.
- **Focus Quality score**: A calculated metric combining duration and attention signals.
- **Deep Historical Data**: Detailed logs of every session including primary mood and duration.

### 🏆 10. Gamification & Community
Making consistency rewarding.
- **Global Leaderboard**: Compete with students worldwide for the top spot.
- **XP & Levels**: Earn experience for every minute of focus and every task completed.
- **Achievements/Badges**: Unlock premium badges (Novice, Deep Thinker, Zen Master) for hitting milestones.
- **Daily Quests**: Global challenges that reset every 24 hours.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4.0, Framer Motion (Glassmorphism) |
| **Backend** | Firebase Realtime Database, Firestore, Auth |
| **Real-time** | Socket.io (Standalone Server), WebRTC |
| **AI / ML** | Google Gemini 2.5 Flash, face-api.js, MediaPipe |
| **Visualization**| Recharts (Data Viz), Lucide (Icons) |

---

## 🏗️ Technical Architecture
MindTrack uses a **Split-Server Architecture**:
1. **Next.js Hub**: Handles the UI, Auth, AI Inference (Serverless), and Personal Data.
2. **Socket-IO Orchestrator**: A dedicated server for real-time signaling, room synchronization, and collaborative editing.
3. **P2P Video Mesh**: Direct peer-to-peer data flow for video to ensure low-latency communication.

---

## 🚀 Setup Instructions

1. **Clone & Install**:
   ```bash
   git clone https://github.com/your-repo/mindtrack.git
   npm install
   ```
2. **Environment Variables**: Populate `.env.local` with your Firebase and Gemini keys.
3. **Launch Ecosystem**:
   ```bash
   npm run dev:all
   ```
   *This command starts both the Next.js frontend and the Socket.io collaboration server.*

---

<div align="center">

Built with ❤️ by **Harsh Sharma**

*MindTrack — Where focus meets intelligence.*

</div>
