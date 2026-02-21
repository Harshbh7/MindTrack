"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { realtimeDb } from "@/lib/firebase";
import { ref, update, onValue, query, orderByChild, equalTo } from "firebase/database";
import { db } from "@/lib/firebase";
import { Shield, CheckCircle, XCircle, Video } from "lucide-react";

// Define types
interface Resource {
    id: string;
    title: string;
    link: string;
    type: string;
    submittedByName: string;
    status: string;
}

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingRole, setCheckingRole] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSessions: 0,
        pendingApprovals: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);
    const [pendingResources, setPendingResources] = useState<Resource[]>([]);

    useEffect(() => {
        const checkAdmin = async () => {
            // If auth is done loading but no user, redirecting or denying access
            if (!loading && !user) {
                setCheckingRole(false);
                return;
            }

            if (!user) return; // Wait for user if loading

            try {
                // Security Check: Verify Email & Role
                if (user.email === "harshbh20102@gmail.com") {
                    setIsAdmin(true);
                    // Sync Role to DB if needed
                    const userRef = doc(db, "users", user.uid);
                    getDoc(userRef).then((snap) => {
                        if (snap.exists() && snap.data().role !== "admin") {
                            updateDoc(userRef, { role: "admin" });
                        }
                    });
                } else {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists() && userDoc.data().role === "admin") {
                        setIsAdmin(true);
                    }
                }
            } catch (err) {
                console.error("Verification failed:", err);
            } finally {
                setCheckingRole(false);
            }
        };

        checkAdmin();
    }, [user, loading]);

    // Fetch Stats & Pending Resources
    useEffect(() => {
        if (!isAdmin) return;

        // 1. Total Users (Firestore)
        const fetchUsers = async () => {
            try {
                const usersSnap = await getDocs(collection(db, "users"));
                setStats(prev => ({ ...prev, totalUsers: usersSnap.size }));
            } catch (e) {
                console.error("Stats Error:", e);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchUsers();

        // 2. Pending Approvals (Realtime DB)
        const videosRef = query(ref(realtimeDb, "video"), orderByChild("status"), equalTo("pending"));
        const unsubscribe = onValue(videosRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([key, value]: [string, any]) => ({
                    id: key,
                    ...value,
                }));
                // Filter specifically for "pending" just in case
                const pending = list.filter(r => r.status === "pending");
                setPendingResources(pending);
                setStats(prev => ({ ...prev, pendingApprovals: pending.length }));
            } else {
                setPendingResources([]);
                setStats(prev => ({ ...prev, pendingApprovals: 0 }));
            }
        });

        return () => unsubscribe();
    }, [isAdmin]);

    const handleApprove = async (id: string) => {
        try {
            const videoRef = ref(realtimeDb, `video/${id}`);
            await update(videoRef, { status: "approved" });
            // State updates automatically via listener
        } catch (error) {
            console.error("Error approving:", error);
            alert("Failed to approve.");
        }
    };

    const handleReject = async (id: string) => {
        try {
            const videoRef = ref(realtimeDb, `video/${id}`);
            await update(videoRef, { status: "rejected" });
            // State updates automatically via listener
        } catch (error) {
            console.error("Error rejecting:", error);
            alert("Failed to reject.");
        }
    };

    if (loading || checkingRole) {
        return (
            <div className="flex h-full items-center justify-center p-6 bg-gray-950">
                <div className="flex flex-col items-center animate-pulse">
                    <Shield className="h-10 w-10 text-blue-500 mb-2" />
                    <p className="text-blue-400 font-mono text-sm">VERIFYING ADMIN ID...</p>
                </div>
            </div>
        );
    }

    // Demo: If not admin, show warning but maybe allow viewing for functionality showcase if desired?
    // Let's strictly block UI but provide a way to become admin in Firestore console manually.
    if (!isAdmin) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-center">
                <Shield className="h-16 w-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-white">Access Denied</h1>
                <p className="text-gray-400 mt-2">You do not have administrator privileges.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-sm font-bold border border-red-500/20">
                    ADMIN MODE
                </span>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                    <h3 className="text-sm font-medium text-gray-400">Total Users</h3>
                    <p className="mt-2 text-3xl font-bold text-white">
                        {loadingStats ? "..." : stats.totalUsers}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                    <h3 className="text-sm font-medium text-gray-400">Active Sessions</h3>
                    <p className="mt-2 text-3xl font-bold text-blue-400">
                        {loadingStats ? "..." : stats.activeSessions}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                    <h3 className="text-sm font-medium text-gray-400">Pending Approvals</h3>
                    <p className="mt-2 text-3xl font-bold text-yellow-500">
                        {loadingStats ? "..." : stats.pendingApprovals}
                    </p>
                </div>
            </div>

            {/* Content Moderation */}
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <h2 className="mb-4 text-xl font-bold text-white flex items-center">
                    <Video className="mr-2 h-5 w-5 text-purple-400" />
                    Content Moderation
                </h2>
                <div className="overflow-hidden rounded-lg border border-gray-800">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-gray-950 text-gray-200">
                            <tr>
                                <th className="p-4">Suggested By</th>
                                <th className="p-4">Title / Link</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 bg-gray-900">
                            {pendingResources.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500 italic">
                                        No pending content submissions found.
                                    </td>
                                </tr>
                            ) : (
                                pendingResources.map((res) => (
                                    <tr key={res.id} className="hover:bg-gray-800/50">
                                        <td className="p-4">{res.submittedByName}</td>
                                        <td className="p-4">
                                            <div className="font-medium text-white">{res.title}</div>
                                            <a href={res.link} target="_blank" className="text-xs text-blue-400 truncate max-w-[200px] hover:underline">
                                                {res.link}
                                            </a>
                                        </td>
                                        <td className="p-4">
                                            <span className="rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-500 uppercase">
                                                {res.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleApprove(res.id)}
                                                className="rounded-lg bg-green-500/10 p-2 text-green-500 hover:bg-green-500/20"
                                                title="Approve"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleReject(res.id)}
                                                className="rounded-lg bg-red-500/10 p-2 text-red-500 hover:bg-red-500/20"
                                                title="Reject"
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
