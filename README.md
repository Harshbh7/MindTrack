<div align="center">

# 🧠 MindTrack: The Cyber-Premium Study OS

### AI-Driven • Real-time • High-Performance

**MindTrack is a unified premium ecosystem designed to gamify, track, and optimize every second of your learning journey.**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.9.0-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.3-ff69b4?style=for-the-badge&logo=framer)](https://www.framer.com/motion/)

</div>

---

## 🚀 Vision
**MindTrack** is not just a productivity app; it's a **"Study OS"** built with a Cyber-Dark glassmorphic aesthetic. It leverages **Computer Vision**, **Large Language Models**, and **Real-time Synchronization** to create the ultimate focused environment for modern scholars.

---

## 📦 Core Modules

### 🏠 1. Central Command Dashboard
The hub of your productivity data.
- **Activity Heatmap**: A GitHub-style visual contribution calendar for all your study sessions.
- **Deep Analytics**: Real-time bar charts (using Recharts) visualizing focus duration across the last 7 days.
- **Micro-Widgets**: Floating widgets for Daily Quests, Todo management, and Study Goals.
- **Live Stats**: Instant tracking of Total Focus Hours, Active Streaks, and Level Progress.

### ⏱️ 2. AI Focus Engine (Neural Tracking)
The heart of the ecosystem, ensuring maximum retention.
- **Biometric Monitoring**: Uses `face-api.js` and MediaPipe to ensure physical presence and active engagement.
- **Auto-Intelligence**: Instantly pauses your timer when you look away or lose focus, resuming the moment you return.
- **Emotional Mapping**: Tracks your mood (Happy, Focused, Neutral) throughout the session to provide productivity-to-mood correlation reports.

### 🎥 3. AI Video Hub (New!)
Turn passive watching into active learning.
- **Instant Summaries**: Paste any study video topic and receive a structured Markdown "Cheat Sheet" powered by **Gemini 2.5 Flash**.
- **Key Concepts Extraction**: The AI identifies critical terms and explains them in context.
- **Seamless Integration**: Study while the AI generates your notes in the background.

### 💻 4. Cyber-IDE (Integrated Coding Arena)
A premium development environment for learning to code.
- **Glassmorphic Editor**: A custom Monaco-based IDE with "MindTrack Vision" theme.
- **AI Code Review**: One-click analysis finds logic errors and suggests performance optimizations.
- **Live Preview**: Built-in environment for real-time code execution and visualization.

### ⚔️ 5. Focus Battle & Gamification
Making consistency addictive.
- **Focus Battles**: Compete in real-time "Focus Duels" with other students to see who stays in the zone longer.
- **Pet System**: Each scholar has a virtual AI pet that grows and evolves as you complete your goals.
- **Global Leaderboard**: Climb the ranks from "Novice" to "Zen Master" on the prestigious global stage.
- **XP Ecosystem**: Earn experience points for every minute of focus, unlocking premium badges and UI themes.

### 🎯 6. Focus Board (Project Management)
High-end task organization for your learning path.
- **Intelligent Kanban**: Animated task transitions powered by `@hello-pangea/dnd`.
- **Priority Matrix**: Visual classification of tasks by impact and urgency.
- **Cloud Sync**: Every task update is instantly synced via Firebase for a multi-device experience.

### 🗺️ 7. AI Roadmap Master
Mapping your path to expertise.
- **Dynamic Curriculum**: Input a topic (e.g., "Deep Learning"), and the AI builds a specialized learning path.
- **Progress Tracking**: Visual indicators show your current position on the mastery curve.

---

## 🔮 Future Expansion Roadmap (Coming Soon)

We are constantly pushing the boundaries of what a Study OS can do. Here are some of the high-impact features currently in development:

- **🤖 AI Voice Companion (Jarvis for Studying)**: An always-on voice assistant you can talk to. Ask questions, request quizzes, or command the dashboard completely hands-free using the Web Speech API and Gemini 2.5 Flash.
- **🎵 Adaptive Focus Audio & Lo-Fi Hub**: A built-in spatial audio player that **adapts to your focus**. If the Face Tracking AI detects you losing focus, the music subtly changes tempo to bring you back into the zone.
- **🐉 Pomodoro "Boss Fights"**: After completing a long focus session, face off against an "AI Boss". Defeat it by answering a quick quiz generated from your recent notes to claim bonus XP and loot.
- **🗂️ Auto-Magic Flashcards (SRS System)**: Zero-friction studying. MindTrack will automatically read your collaborative notes and extract key definitions to create a deck of Spaced-Repetition Flashcards.
- **👁️ Advanced Biometrics (Posture & Eye Strain)**: Utilizing `face-api.js` to track blink rate and posture, automatically reminding you of the 20-20-20 rule or dimming the screen if you slouch.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16.1.6 (App Router), React 19.2.3, TypeScript |
| **Styling** | Tailwind CSS 4.0, Framer Motion (Glassmorphism), Lucide Icons |
| **Intelligence** | Google Gemini 2.5 Flash, face-api.js, MediaPipe Face Detection |
| **Persistence** | Firebase Realtime Database, Firestore, Firebase Auth |
| **Real-time** | Socket.io (Standalone Orchestrator), WebRTC (Simple-Peer) |
| **Visualization**| Recharts (Data Viz), SweetAlert2 (Interactive Feedback) |

---

## 🏗️ Technical Architecture

MindTrack operates on a **Distributed Twin-Server Model**:
1. **The Hub (Next.js)**: Orchestrates the UI, AI Inference (Serverless), and Personal Data persistence.
2. **The Pulse (Socket.io)**: A dedicated persistent server handling real-time signaling, collaborative state, and Focus Battles.
3. **P2P Mesh**: High-bandwidth data flow for collaborative video and whiteboard (tldraw) sessions.

---

## 🚀 Setup & Installation

1. **Clone the Galaxy**:
   ```bash
   git clone https://github.com/your-repo/mindtrack.git
   cd MindTrack
   ```

2. **Initialize Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env.local` file with your credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_CONFIG={...}
   GEMINI_API_KEY=your_key_here
   OPENAI_API_KEY=optional_key
   ```

4. **Launch the Ecosystem**:
   ```bash
   npm run dev:all
   ```
   *This command leverages `concurrently` to start both the Next.js frontend and the Socket.io backend.*

---

<div align="center">

Built with ❤️ by **Harsh Sharma**

*MindTrack — Performance through Intelligence.*

</div>
