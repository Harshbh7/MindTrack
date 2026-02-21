# MindTrack 🧠🚀

**MindTrack** is an AI-powered collaborative study, coding, and focus platform designed to revolutionize how students and developers learn and work together. It combines real-time collaboration tools, AI assistance, and focus monitoring into a single, cohesive application.

## 🌟 Features

### 🧠 Smart Focus Timer
- **Face Detection & Auto-Pause**: Uses your webcam to detect if you are looking at the screen. The timer automatically pauses if you look away or leave, ensuring true focus time tracking.
- **Strict Mode**: Optional setting to enforce presence for the timer to run.

### 🤝 Real-Time Collaboration
- **Study Rooms**: Create private rooms to study with friends or join public sessions.
- **Video & Audio Calls**: Seamless WebRTC-based communication for study groups.
- **Collaborative Whiteboard**: Infinite canvas for brainstorming, drawing, and diagramming (powered by tldraw) with real-time sync.
- **Code Editor**: Multi-language support (JS, Python, C++, etc.) with syntax highlighting and live execution (powered by Monaco Editor).
- **Live Chat**: Integrated chat for instant communication within rooms.

### 🎵 Integrated Music Player
- **Focus Modes**: Built-in Lo-Fi, Rain, and Ambient Piano tracks to help you get in the zone.
- **Mini Player**: Dynamic, minimized floating player that stays out of your way while you work.

### 🏆 Gamification & Productivity
- **XP System & Leaderboard**: Earn XP for every minute of focused study and compete on global leaderboards.
- **Kanban Board**: Manage tasks and projects efficiently.
- **Todo List**: Keep track of daily goals.
- **Productivity Heatmap**: Visualize your study habits over time.

### 🤖 AI Assistance
- **AI Study Plan**: Generate personalized study plans using OpenAI.
- **Flashcard Generator**: Create study aids automatically.

## 🛠️ Tech Stack

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), React 19
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), Framer Motion, Lucide React
- **Real-Time Engine**: [Socket.io](https://socket.io/), Simple Peer (WebRTC)
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Realtime Database, Auth)
- **AI & ML**:
    - [MediaPipe / Face-API.js](https://github.com/justadudewhohacks/face-api.js/) (Face Detection)
    - OpenAI API (Study Assistant)
- **Tools**: [Monaco Editor](https://microsoft.github.io/monaco-editor/) (Code), [tldraw](https://tldraw.dev/) (Whiteboard)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/MindTrack.git
    cd MindTrack
    ```

2.  **Install Frontend Dependencies:**
    ```bash
    npm install
    ```

3.  **Install Socket Server Dependencies:**
    ```bash
    cd socket-server
    npm install
    cd ..
    ```

4.  **Set up Environment Variables:**
    Create a `.env.local` file in the root directory with the following variables:
    
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    
    OPENAI_API_KEY=your_openai_api_key
    
    # URL of your socket server (local or deployed)
    NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
    ```

### Running the Application

You need to run both the Next.js frontend and the Socket.io backend.

1.  **Start the Socket Server (Terminal 1):**
    ```bash
    node socket-server/index.js
    ```
    *The server normally runs on port 4000.*

2.  **Start the Frontend (Terminal 2):**
    ```bash
    npm run dev
    ```
    *The application will run on [http://localhost:3005](http://localhost:3005).*

## 📄 License

This project is licensed under the MIT License.
