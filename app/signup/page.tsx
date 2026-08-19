"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Chrome, Feather, ArrowRight } from "lucide-react";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: name });

                const role = email === "harshbh20102@gmail.com" ? "admin" : "student";

                await setDoc(doc(db, "users", auth.currentUser.uid), {
                    uid: auth.currentUser.uid,
                    name: name,
                    email: email,
                    role: role,
                    createdAt: new Date().toISOString(),
                });
            }
            router.push("/dashboard");
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setError("Email is already in use.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            } else if (err.code === 'auth/invalid-email') {
                setError("Please enter a valid email address.");
            } else {
                setError(err.message || "Failed to create account. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const snap = await getDoc(userRef);
                if (!snap.exists()) {
                    const role = user.email === "harshbh20102@gmail.com" ? "admin" : "student";
                    await setDoc(userRef, {
                        uid: user.uid,
                        name: user.displayName || name || "User",
                        email: user.email || "",
                        role: role,
                        createdAt: new Date().toISOString(),
                    });
                }
            }
            router.push("/dashboard");
        } catch (err: any) {
            setError("Google sign-in failed: " + (err.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[#faf8f5] dark:bg-[#0c1017] text-stone-900 dark:text-stone-100 p-4 transition-colors overflow-hidden">
            {/* Ambient Aura */}
            <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-br from-emerald-400/20 via-teal-300/15 to-amber-300/15 blur-[120px] rounded-full animate-aura dark:from-emerald-600/10 dark:via-teal-600/10" />

            <div className="relative z-10 w-full max-w-md space-y-6 rounded-3xl bg-white/85 dark:bg-stone-900/85 p-8 sm:p-10 shadow-xl border border-stone-200/90 dark:border-stone-800 backdrop-blur-xl">
                <div className="text-center">
                    <Link href="/" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/25 mb-3">
                        <Feather className="h-6 w-6" />
                    </Link>
                    <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">Create Account</h2>
                    <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">Join a mindful community of scholars</p>
                </div>

                <form className="mt-6 space-y-4" onSubmit={handleSignup}>
                    <div className="space-y-3">
                        <div className="relative">
                            <User className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                            <input
                                type="text"
                                required
                                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800/80 p-3 pl-10 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                            <input
                                type="email"
                                required
                                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800/80 p-3 pl-10 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                            <input
                                type="password"
                                required
                                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800/80 p-3 pl-10 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && <p className="text-xs text-rose-500 font-medium text-center bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg">{error}</p>}

                    <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 dark:bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-stone-800 dark:hover:bg-emerald-500 shadow-md shadow-emerald-500/10"
                    >
                        <span>Start Free Journey</span>
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-stone-200 dark:border-stone-800" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-white dark:bg-stone-900 px-3 text-stone-500 dark:text-stone-400 font-medium">Or sign up with</span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <button
                            onClick={handleGoogleLogin}
                            className="flex w-full items-center justify-center rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-800/60 px-4 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
                        >
                            <Chrome className="mr-2 h-4 w-4 text-red-500" />
                            Google
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs text-stone-500 dark:text-stone-400">
                    Already have an account?{' '}
                    <Link href="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
