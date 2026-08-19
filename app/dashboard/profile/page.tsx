"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, auth, realtimeDb } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, update } from "firebase/database";
import { updateProfile } from "firebase/auth";
import { User, Mail, Save, UserCircle } from "lucide-react";

export default function ProfilePage() {
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            try {
                // Try fetching from Firestore first as it's our source of truth for app features
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setName(userDoc.data().name || "");
                } else {
                    // Fallback to Auth profile
                    setName(user.displayName || "");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setMessage(null);

        // Run all updates in parallel
        const promises = [
            // 1. Update Firestore
            updateDoc(doc(db, "users", user.uid), { name }),

            // 2. Update Auth Profile
            auth.currentUser ? updateProfile(auth.currentUser, { displayName: name }) : Promise.resolve(),

            // 3. Sync to Realtime DB
            update(ref(realtimeDb, `allUsers/${user.uid}`), {
                name: name,
                email: user.email,
                lastUpdated: Date.now()
            }).catch(err => {
                console.error("Realtime DB Sync Failed:", err);
                throw err; // Re-throw to be caught by Promise.all
            })
        ];

        try {
            await Promise.all(promises);
            console.log("Profile updated successfully across all stores.");
            setMessage({ type: 'success', text: "Profile updated successfully!" });
        } catch (error) {
            console.error("Error updating profile:", error);
            // Even if one fails, we might want to tell the user partial success or just general error
            setMessage({ type: 'error', text: "Failed to update profile completely. Check console for details." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center text-gray-500 py-20">Loading profile...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-purple-500/20">
                    {name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{name}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm transition-colors">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <UserCircle className="mr-2 h-5 w-5 text-purple-500 dark:text-purple-400" />
                    My Profile
                </h3>

                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                            Display Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg py-2.5 pl-10 pr-4 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors shadow-sm"
                                placeholder="Your Name"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="email"
                                value={user?.email || ""}
                                disabled
                                className="w-full bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg py-2.5 pl-10 pr-4 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-600">Email cannot be changed securely from here yet.</p>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-500/20"
                    >
                        {saving ? (
                            "Saving..."
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Save Changes
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
