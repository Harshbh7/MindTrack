"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Heart, 
  Users, 
  Code2, 
  Compass, 
  ArrowRight, 
  ShieldCheck, 
  Smile, 
  Coffee, 
  Flame, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  ChevronRight,
  SunMedium,
  BrainCircuit,
  MessageSquareHeart,
  Feather
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type Headspace = "overwhelmed" | "focused" | "scattered" | "lonely";

interface HeadspaceData {
  title: string;
  tag: string;
  emoji: string;
  color: string;
  recommendation: string;
  action: string;
  actionHref: string;
  quote: string;
}

const HEADSPACE_MAP: Record<Headspace, HeadspaceData> = {
  overwhelmed: {
    title: "Feeling Overwhelmed",
    tag: "Calm & Reset",
    emoji: "🧘",
    color: "from-emerald-50 via-teal-50/80 to-emerald-100/50 border-emerald-200 text-emerald-950 dark:from-teal-500/20 dark:to-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-200",
    recommendation: "Take 2 minutes to breathe. Pick just ONE small concept. We'll mute all noisy metrics and support you with low-pressure 15-minute gentle blocks.",
    action: "Try a 2-Min Reset",
    actionHref: "/dashboard/timer",
    quote: "You don't have to finish everything today. Just showing up is more than enough."
  },
  focused: {
    title: "In The Zone & Energized",
    tag: "Deep Flow",
    emoji: "⚡",
    color: "from-amber-50 via-orange-50/80 to-amber-100/50 border-amber-200 text-amber-950 dark:from-amber-500/20 dark:to-orange-500/20 dark:border-amber-500/40 dark:text-amber-200",
    recommendation: "Awesome momentum! Let's lock in a 50-minute Deep Flow session with ambient lo-fi soundscapes and auto-generated flashcards.",
    action: "Launch Deep Flow",
    actionHref: "/dashboard/learning",
    quote: "Ride the wave of clarity. Protect this window from distractions."
  },
  scattered: {
    title: "Mind is Wandering",
    tag: "Gentle Structure",
    emoji: "🌱",
    color: "from-purple-50 via-indigo-50/80 to-purple-100/50 border-purple-200 text-purple-950 dark:from-purple-500/20 dark:to-indigo-500/20 dark:border-purple-500/40 dark:text-purple-200",
    recommendation: "Let AI break your scary 5-page syllabus into 3 bite-sized steps. Pair up with a focus buddy to stay anchored.",
    action: "Generate AI Step-by-Step",
    actionHref: "/dashboard",
    quote: "Focus isn't about perfection. It's simply the art of gently returning when you drift."
  },
  lonely: {
    title: "Need Accountability",
    tag: "Silent Co-Study",
    emoji: "☕",
    color: "from-rose-50 via-pink-50/80 to-rose-100/50 border-rose-200 text-rose-950 dark:from-rose-500/20 dark:to-pink-500/20 dark:border-rose-500/40 dark:text-rose-200",
    recommendation: "Hop into a Cozy Study Room. 6 other scholars are quietly working alongside you right now. No awkward camera pressure, just shared energy.",
    action: "Join Study Room",
    actionHref: "/dashboard/room",
    quote: "Everything feels lighter when you know you are not running the marathon alone."
  }
};

export default function Home() {
  const [selectedHeadspace, setSelectedHeadspace] = useState<Headspace>("overwhelmed");
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Pause">("Inhale");
  const [breathCounter, setBreathCounter] = useState(4);
  const [isMuted, setIsMuted] = useState(true);

  // Breathing Box Timer simulation
  useEffect(() => {
    const phases: Array<"Inhale" | "Hold" | "Exhale" | "Pause"> = ["Inhale", "Hold", "Exhale", "Pause"];
    let phaseIndex = 0;
    let count = 4;

    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        phaseIndex = (phaseIndex + 1) % phases.length;
        setBreathPhase(phases[phaseIndex]);
        count = 4;
      }
      setBreathCounter(count);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const activeData = HEADSPACE_MAP[selectedHeadspace];

  return (
    <div className="relative min-h-screen bg-[#faf8f5] text-[#1c1917] dark:bg-[#0c1017] dark:text-[#f0f6fc] transition-colors duration-300 selection:bg-emerald-500/20 overflow-hidden">
      {/* Ambient Zen Aura Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-br from-emerald-400/15 via-teal-400/10 to-amber-300/15 blur-[120px] rounded-full animate-aura dark:from-emerald-600/10 dark:via-teal-600/10 dark:to-purple-800/10" />
      <div className="pointer-events-none absolute top-[45%] -right-40 w-[500px] h-[500px] bg-gradient-to-tl from-purple-400/10 via-rose-300/10 to-transparent blur-[140px] rounded-full dark:from-purple-900/15" />
      <div className="pointer-events-none absolute bottom-20 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-500/10 via-amber-200/10 to-transparent blur-[150px] rounded-full dark:from-emerald-950/20" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-stone-200/70 dark:border-stone-800/70 bg-[#faf8f5]/80 dark:bg-[#0c1017]/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/25 transition-transform group-hover:scale-105">
              <Feather className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                MindTrack
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 -mt-0.5">Mindful Study & Focus</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600 dark:text-stone-300">
            <a href="#headspace" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Headspace Matcher</a>
            <a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Human-First Features</a>
            <a href="#breathing" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Breathe & Reset</a>
            <a href="#philosophy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Why Mindful?</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-xl bg-stone-900 text-white dark:bg-emerald-600 px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-stone-800 dark:hover:bg-emerald-500 transition-all hover:shadow-emerald-500/20"
            >
              <span>Begin Flow</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-6xl px-6 pt-16 pb-24 text-center">
        {/* Soft Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300 backdrop-blur-sm mb-8 animate-float-gentle">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>A kinder, more human way to study and achieve flow</span>
        </div>

        {/* Main Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 leading-[1.15]">
          Study with empathy. <br />
          <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 dark:from-emerald-400 dark:via-teal-300 dark:to-amber-400 bg-clip-text text-transparent">
            Breathe easy, grow daily.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
          Productivity isn't about grinding yourself into burnout. MindTrack adapts to your daily mental energy with gentle focus timers, cozy peer rooms, and AI-guided calm.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>Start Mindful Session</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href="#headspace"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-900/60 px-7 py-4 text-base font-semibold text-stone-700 dark:text-stone-200 backdrop-blur-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
          >
            <span>Check Your Headspace</span>
            <Smile className="h-5 w-5 text-amber-500" />
          </a>
        </div>

        {/* Human Trust Proof */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500 dark:text-stone-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Zero guilt streaks
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Private & thoughtful sensing
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 100% free & open collaborative rooms
          </span>
        </div>

        {/* Interactive Section: Headspace Matcher */}
        <section id="headspace" className="mt-24 text-left">
          <div className="rounded-3xl border border-stone-200/90 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-8 sm:p-12 shadow-xl backdrop-blur-xl transition-all">
            <div className="max-w-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Emotional State Check-in
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
                How is your headspace right now?
              </h2>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                Learning works best when tools adapt to your human feelings, not robotic quotas.
              </p>
            </div>

            {/* Headspace Selector Buttons */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.keys(HEADSPACE_MAP) as Headspace[]).map((key) => {
                const item = HEADSPACE_MAP[key];
                const isSelected = selectedHeadspace === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedHeadspace(key)}
                    className={`flex flex-col items-start gap-1 p-4 rounded-2xl border text-left transition-all duration-200 ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 shadow-md ring-2 ring-emerald-500/20"
                        : "border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-100/50"
                    }`}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-sm font-semibold mt-1">{item.title}</span>
                    <span className="text-[11px] opacity-75">{item.tag}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Headspace Action Card */}
            <div className={`mt-6 rounded-2xl border p-6 sm:p-8 bg-gradient-to-br transition-all duration-300 ${activeData.color}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-black/10 dark:bg-white/10 px-3 py-1 text-xs font-semibold">
                    <span>{activeData.emoji}</span>
                    <span>Recommended Flow for You</span>
                  </div>
                  <p className="text-base sm:text-lg font-medium text-stone-900 dark:text-stone-100 max-w-2xl">
                    {activeData.recommendation}
                  </p>
                  <p className="text-xs italic text-stone-600 dark:text-stone-400">
                    "{activeData.quote}"
                  </p>
                </div>
                <Link
                  href={activeData.actionHref}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-950 px-6 py-3.5 text-sm font-bold shadow-md hover:opacity-90 transition-opacity"
                >
                  <span>{activeData.action}</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Live Breathing Widget Section */}
        <section id="breathing" className="mt-28">
          <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-gradient-to-b from-stone-100/70 to-stone-50/70 dark:from-stone-900/50 dark:to-stone-950/70 p-8 sm:p-14 backdrop-blur-xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Instant Stress Relief
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-stone-100">
                Box Breathing Pacer
              </h2>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                Take a mindful 30-second break before your study block. Calm your nervous system.
              </p>
            </div>

            {/* Breathing Visual Sphere */}
            <div className="mt-12 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center">
                {/* Outer Breathing Rings */}
                <div className="h-56 w-56 sm:h-64 sm:w-64 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 animate-breathe flex items-center justify-center border border-emerald-500/30">
                  <div className="h-40 w-40 sm:h-48 sm:w-48 rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-400/30 to-amber-300/20 backdrop-blur-md flex flex-col items-center justify-center text-center p-4 shadow-inner">
                    <span className="text-xs font-semibold uppercase tracking-widest text-emerald-800 dark:text-emerald-200">
                      {breathPhase}
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
                      {breathCounter}s
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-8 text-xs text-stone-500 dark:text-stone-400 max-w-md text-center">
                Inhale gently through your nose (4s) • Hold without tension (4s) • Exhale softly through your mouth (4s) • Rest (4s)
              </p>
            </div>
          </div>
        </section>

        {/* Human-First Features Grid */}
        <section id="features" className="mt-28 text-left">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Thoughtfully Crafted
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-stone-100">
              Tools designed around human biology
            </h2>
            <p className="mt-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base">
              Traditional study apps treat you like a machine. MindTrack respects your attention span, physical posture, and mental energy.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-3xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 p-8 backdrop-blur-md hover:border-emerald-500/50 hover:shadow-xl transition-all">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shadow-sm group-hover:scale-110 transition-transform">
                <SunMedium className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
                Gentle Posture & Focus Sensing
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Smart face-sensing that acts like a caring mentor. If you slouch or drift off, it gently reminds you to hydrate and take an eye-break without harsh penalties.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-3xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 p-8 backdrop-blur-md hover:border-purple-500/50 hover:shadow-xl transition-all">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 shadow-sm group-hover:scale-110 transition-transform">
                <Coffee className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
                Cozy Silent Study Rooms
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                The library vibe from your home. Study alongside friends with synchronized ambient timers, shared notes, and zero video stress.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-3xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 p-8 backdrop-blur-md hover:border-amber-500/50 hover:shadow-xl transition-all">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shadow-sm group-hover:scale-110 transition-transform">
                <BrainCircuit className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
                Empathetic AI Study Plans
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Tired of overwhelming 100-page roadmaps? MindTrack's AI breaks down concepts into conversational step-by-step milestones customized for your pace.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-3xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 p-8 backdrop-blur-md hover:border-teal-500/50 hover:shadow-xl transition-all">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 shadow-sm group-hover:scale-110 transition-transform">
                <Code2 className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
                Distraction-Free Code & Notes
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                A calm, integrated Monaco IDE & Markdown canvas. Solve algorithms, sketch whiteboard diagrams, and store notes without tab overload.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group rounded-3xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 p-8 backdrop-blur-md hover:border-rose-500/50 hover:shadow-xl transition-all">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 shadow-sm group-hover:scale-110 transition-transform">
                <Heart className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
                Guilt-Free Streak Protection
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Life happens. Sick days and rest days shouldn't erase your hard-earned progress. MindTrack celebrates consistency with gentle recovery days.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group rounded-3xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 p-8 backdrop-blur-md hover:border-indigo-500/50 hover:shadow-xl transition-all">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shadow-sm group-hover:scale-110 transition-transform">
                <MessageSquareHeart className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
                Supportive Community Decks
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Access curated flashcard decks and study notes made by peers worldwide. Learn together, contribute, and upvote quality materials.
              </p>
            </div>
          </div>
        </section>

        {/* Philosophy: The Mindful Shift */}
        <section id="philosophy" className="mt-28 text-left">
          <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-stone-900 text-white p-8 sm:p-14 shadow-2xl relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                The Mindful Difference
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold">
                Say goodbye to anxiety-driven study apps
              </h2>
              <p className="mt-4 text-stone-300 text-sm sm:text-base leading-relaxed">
                Most platforms treat humans like throughput machines: red alerts, guilt trips, and 12-hour streaks. We built MindTrack because high achievement shouldn't cost you your mental health.
              </p>

              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-5">
                  <span className="text-red-400 font-bold text-sm block mb-1">❌ Old Hustle Culture</span>
                  <ul className="text-xs text-stone-400 space-y-1.5 list-disc list-inside">
                    <li>Strict guilt when missing a day</li>
                    <li>Cold, robotic numbers</li>
                    <li>Isolated, competitive studying</li>
                    <li>Screen fatigue & posture strain</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-5">
                  <span className="text-emerald-400 font-bold text-sm block mb-1">🌿 MindTrack Flow</span>
                  <ul className="text-xs text-emerald-200/90 space-y-1.5 list-disc list-inside">
                    <li>Energy-aligned flow blocks</li>
                    <li>Empathetic check-ins & warm cheers</li>
                    <li>Cozy peer accountability</li>
                    <li>Built-in micro-breaks & breathing</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-28 text-center">
          <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent p-10 sm:p-16 backdrop-blur-xl">
            <span className="text-4xl">🌱</span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-black text-stone-900 dark:text-stone-100">
              Ready to learn with peace of mind?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-stone-600 dark:text-stone-300 text-sm sm:text-base">
              Join thousands of scholars and developers who found their calm, sustainable focus rhythm.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-8 py-4 font-bold text-white shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all text-base"
              >
                Create Free Account
              </Link>
              <Link
                href="/dashboard"
                className="rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-8 py-4 font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all text-base"
              >
                Explore Demo Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Warm Zen Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-[#faf8f5] dark:bg-[#0c1017] py-12 text-center text-xs text-stone-500 dark:text-stone-400">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-stone-700 dark:text-stone-300">
            <Feather className="h-4 w-4 text-emerald-500" />
            <span>MindTrack • Mindful Study Companion</span>
          </div>
          <p>© 2026 MindTrack. Nurtured for peaceful learning and human flow.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-emerald-500">Sign In</Link>
            <Link href="/signup" className="hover:text-emerald-500">Join Community</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
