# DECISIONS.md — MindTrack (Frontend Challenge: Part 2)

**Candidate**: Harsh Sharma  
**Track**: Part 2 — The Premium Home Page (Study OS & Mindful Learning Hub)  
**Live Deployed URL**: [https://mindtrack.vercel.app](https://mindtrack-taupe.vercel.app) *(or your deployed Vercel URL)*  
**GitHub Repository**: [https://github.com/Harshbh7/MindTrack](https://github.com/Harshbh7/MindTrack)

---

### 1. Architecture & Design Direction: Why Humanized Zen Minimalism over Generic Cyber-SaaS Templates?

**The Obvious Alternative Rejected**:  
Most modern study apps follow a loud, neon-saturated "Dark Cyberpunk Hacker" or sterile "SaaS Landing Page" template (dense Bento grids filled with fake 5-star ratings, countdown hype timers, and distracting high-contrast gradients). This directly contradicts what an overwhelmed student actually needs when trying to focus.

**Why Our Design Choice**:  
We deliberately engineered a **"Human-First Zen Study OS"** combining warm parchment neutrals (`#faf8f5`) with deep obsidian dark mode (`#0c1017`) and soothing emerald/teal/amber accents.
- **Interactive Headspace Matcher**: Rather than generic marketing copy, users immediately self-identify their cognitive state (*Overwhelmed*, *Scattered*, *Deep Flow*, *Lonely*) and get adaptive focus suggestions.
- **Zero Fake Social Proof**: We strictly omitted fake "Trusted by 100,000+ students" badges and fictional testimonials. Instead, the interface sells itself through real interactive widgets: a live **4-4-4-4 Box Breathing Reset**, realistic study state cards, and transparent technical architecture.
- **True Dual-Theme Parity**: Implemented a Tailwind CSS v4 custom variant (`@custom-variant dark (&:where(.dark, .dark *));`) ensuring zero half-dark artifacts, high WCAG contrast, and seamless transitions on both 390px mobile screens and 1440px desktop monitors.

---

### 2. Time-Limit Trade-off & What I’d Build With a Full Week

- **The Trade-off**:  
  Under the time constraint, audio playback across the ambient soundscape and lo-fi hub uses static synthesized streams and Web Audio API oscillators, and the AI Roadmaps / Flashcards use synchronous Gemini API route handlers rather than streaming chunked SSE responses.
- **With a Full Week**:
  1. **Streaming Markdown & Generative UI**: Stream Gemini 2.5 Flash responses via Server-Sent Events (SSE) directly into dynamically rendering AST components with inline interactive quizzes.
  2. **WebAssembly Biometric Pipeline**: Move `face-api.js` neural landmark detection into dedicated Web Workers with WebGL offscreen canvas to guarantee a constant 60 FPS even on lower-tier mobile hardware.
  3. **Local-First P2P Sync (CRDTs)**: Implement Y.js over WebRTC mesh for zero-latency peer-to-peer collaborative notes that work completely offline.

---

### 3. AI Usage & Personal Verification/Overhauls

- **Where AI Was Used**:
  - Drafting initial structured JSON schemas for AI study roadmaps and dynamic Gemini prompts for video cheat-sheet extraction.
  - Generating initial CSS utility color pairings and regex replacement foundations for the real-time Markdown preview engine.

- **What I Personally Verified & Rewrote**:
  - **Color Contrast & Theme Hierarchy**: AI originally suggested hardcoded `text-white` and dark containers that vanished in light mode. I audited and rebuilt the token system across all 12 dashboard modules for crisp dark/light contrast.
  - **Firebase Auth & Firestore State Synchronization**: Fixed race conditions in Google Sign-In and email signup where user document records in Firestore weren't created synchronously during OAuth popup handshakes.
  - **Error Resilience & Boundary Handling**: Designed custom App Router error boundaries (`app/error.tsx`, `app/global-error.tsx`) to catch unhandled runtime promise rejections and prevent raw `[object Object]` crashes.
  - **Strict Mobile Viewport & No-Horizontal-Overflow**: Manually audited CSS flex/grid structures from 360px up to 4K displays to ensure zero horizontal scrollbars.

---

### 🎁 Bonus Round: Easter Egg
- **Interactive Zen Trigger**: Click on the breathing widget or companion pet avatar to toggle peaceful meditative aura rings and unlock a hidden motivational quote in the terminal console!
