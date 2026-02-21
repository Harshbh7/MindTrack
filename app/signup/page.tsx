"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Chrome } from "lucide-react";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Update profile with display name
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: name });

                // Create user document in Firestore with default role 'student'
                // Auto-promote specific email to admin
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
            } else {
                setError(err.message || "Failed to create account. Please try again.");
            }
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push("/dashboard");
        } catch (err: any) {
            setError("Google sign-in failed: " + (err.message || "Unknown error"));
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-950 text-white p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-gray-900 p-6 sm:p-8 shadow-2xl border border-gray-800">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-blue-400">MindTrack</h2>
                    <p className="mt-2 text-sm text-gray-400">Create your account</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSignup}>
                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                            <input
                                type="text"
                                required
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 pl-10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                            <input
                                type="email"
                                required
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 pl-10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                            <input
                                type="password"
                                required
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 pl-10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <button
                        type="submit"
                        className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                        Sign up
                    </button>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-gray-900 px-2 text-gray-400">Or continue with</span>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3">
                        <button
                            onClick={handleGoogleLogin}
                            className="flex w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all"
                        >
                            <Chrome className="mr-2 h-5 w-5 text-red-500" />
                            Google
                        </button>
                    </div>
                </div>

                <p className="mt-2 text-center text-sm text-gray-400">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
