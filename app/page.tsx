import Link from "next/link";
import { Brain, Users, Code, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white">
      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600/20 shadow-lg shadow-blue-500/20">
          <Brain className="h-10 w-10 text-blue-400" />
        </div>

        <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-7xl">
          <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            MindTrack
          </span>
        </h1>

        <p className="mb-10 max-w-2xl text-lg text-gray-400">
          The AI-powered collaborative learning platform. Track focus, code together, and master your studies with real-time analytics.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login"
            className="rounded-full bg-blue-600 px-8 py-3.5 font-bold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25"
          >
            Get Started
          </Link>
          <Link
            href="/features"
            className="rounded-full border border-gray-700 bg-gray-900 px-8 py-3.5 font-bold text-gray-300 transition-all hover:bg-gray-800"
          >
            View Features
          </Link>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid w-full max-w-5xl gap-8 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 transition-all hover:border-blue-500/50">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold">AI Focus Timer</h3>
            <p className="text-gray-400">Smart face detection ensures you stay focused on your goals.</p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 transition-all hover:border-purple-500/50">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Study Rooms</h3>
            <p className="text-gray-400">Collaborate with friends in real-time synced sessions.</p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 transition-all hover:border-pink-500/50">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400">
              <Code className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Code Editor</h3>
            <p className="text-gray-400">Built-in professional IDE for solving problems together.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-900 py-8 text-center text-sm text-gray-600">
        © 2026 MindTrack. Built for the future of learning.
      </footer>
    </div>
  );
}
