"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { realtimeDb } from "@/lib/firebase";
import { ref, update, onValue, query, orderByChild, equalTo, set, remove, push } from "firebase/database";
import { db } from "@/lib/firebase";
import { Shield, CheckCircle, XCircle, Video, Users, Clock, Trophy, Ban, AlertTriangle, Megaphone, Target, Trash2, Send } from "lucide-react";

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
        pendingApprovals: 0,
        totalFocusTime: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);
    const [pendingResources, setPendingResources] = useState<Resource[]>([]);
    const [activeUsers, setActiveUsers] = useState<any[]>([]);
    const [allUsersData, setAllUsersData] = useState<Record<string, any>>({});
    const [isTotalUsersModalOpen, setIsTotalUsersModalOpen] = useState(false);
    const [topPerformers, setTopPerformers] = useState<any[]>([]);
    const [allGamificationUsers, setAllGamificationUsers] = useState<any[]>([]);

    const [broadcastMessage, setBroadcastMessage] = useState("");
    const [currentBroadcast, setCurrentBroadcast] = useState<any>(null);
    const [questText, setQuestText] = useState("");
    const [globalQuests, setGlobalQuests] = useState<any[]>([]);

    const [bannedUsers, setBannedUsers] = useState<Record<string, boolean>>({});
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const formatDuration = (timestamp: number) => {
        if (!timestamp) return "Unknown";
        const now = Date.now();
        const diff = Math.floor((now - timestamp) / 60000); // in minutes
        if (diff < 1) return "Just now";
        if (diff < 60) return `${diff}m ago`;
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        return `${hours}h ${mins}m ago`;
    };

    const formatTimeDetailed = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

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

    // 1.c Derive Top Performers purely from valid registered profiles
    useEffect(() => {
        if (Object.keys(allUsersData).length > 0 && allGamificationUsers.length > 0) {
            const validPerformers = allGamificationUsers.filter(u => allUsersData[u.uid]);
            validPerformers.sort((a, b) => b.xp - a.xp);
            setTopPerformers(validPerformers.slice(0, 5));
        } else {
            setTopPerformers([]);
        }
    }, [allUsersData, allGamificationUsers]);

    // Fetch Stats & Pending Resources
    useEffect(() => {
        if (!isAdmin) return;

        // 1. Total Users & Focus Time (Realtime DB)
        const fetchUsers = () => {
            const usersRef = ref(realtimeDb, "users");
            return onValue(usersRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    let appTotalSeconds = 0;
                    const performers: any[] = [];
                    Object.entries(data).forEach(([uid, userData]: [string, any]) => {
                        const seconds = userData?.focusStats?.totalSeconds || 0;
                        const xp = userData?.gamification?.xp || 0;
                        const level = userData?.gamification?.level || 5;
                        appTotalSeconds += seconds;
                        performers.push({ uid, seconds, xp, level });
                    });

                    setAllGamificationUsers(performers);

                    setStats(prev => ({ 
                        ...prev, 
                        totalFocusTime: appTotalSeconds
                    }));
                } else {
                    setStats(prev => ({ ...prev, totalFocusTime: 0 }));
                    setAllGamificationUsers([]);
                }
                setLoadingStats(false);
            });
        };
        const unsubscribeTotalUsers = fetchUsers();

        // 1.b Get extra profile data for users (Realtime DB)
        const fetchAllUsersData = () => {
            const allUsersRef = ref(realtimeDb, "allUsers");
            return onValue(allUsersRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setAllUsersData(data);
                    setStats(prev => ({ ...prev, totalUsers: Object.keys(data).length }));
                } else {
                    setAllUsersData({});
                    setStats(prev => ({ ...prev, totalUsers: 0 }));
                }
            });
        };
        const unsubscribeAllUsers = fetchAllUsersData();

        // 2. Pending Approvals (Realtime DB)
        const videosRef = query(ref(realtimeDb, "video"), orderByChild("status"), equalTo("pending"));
        const unsubscribeVideos = onValue(videosRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([key, value]: [string, any]) => ({
                    id: key,
                    ...value,
                }));
                const pending = list.filter(r => r.status === "pending");
                setPendingResources(pending);
                setStats(prev => ({ ...prev, pendingApprovals: pending.length }));
            } else {
                setPendingResources([]);
                setStats(prev => ({ ...prev, pendingApprovals: 0 }));
            }
        });

        // 3. Active Sessions (Realtime DB)
        const sessionsRef = ref(realtimeDb, "sessions");
        const unsubscribeSessions = onValue(sessionsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([key, value]: [string, any]) => ({
                    uid: key,
                    ...value,
                }));
                const onlineUsers = list.filter(u => u.state === 'online');
                setActiveUsers(onlineUsers);
                setStats(prev => ({ ...prev, activeSessions: onlineUsers.length }));
            } else {
                setActiveUsers([]);
                setStats(prev => ({ ...prev, activeSessions: 0 }));
            }
        });

        // 4. Broadcasts
        const broadcastRef = ref(realtimeDb, "broadcast/announcement");
        const unsubBroadcast = onValue(broadcastRef, (snapshot) => {
            setCurrentBroadcast(snapshot.val() || null);
        });

        // 5. Global Quests
        const questsRef = ref(realtimeDb, "globalQuests");
        const unsubQuests = onValue(questsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([key, value]) => ({
                    id: key,
                    ...(value as object)
                }));
                setGlobalQuests(list);
            } else {
                setGlobalQuests([]);
            }
        });

        // 6. Banned Users
        const bannedRef = ref(realtimeDb, "bannedUsers");
        const unsubBanned = onValue(bannedRef, (snapshot) => {
            setBannedUsers(snapshot.val() || {});
        });

        return () => {
            unsubscribeTotalUsers();
            unsubscribeAllUsers();
            unsubscribeVideos();
            unsubscribeSessions();
            unsubBroadcast();
            unsubQuests();
            unsubBanned();
        };
    }, [isAdmin]);

    const handleSendBroadcast = async () => {
        if (!broadcastMessage.trim()) return;
        try {
            await set(ref(realtimeDb, "broadcast/announcement"), {
                message: broadcastMessage.trim(),
                timestamp: Date.now()
            });
            setBroadcastMessage("");
        } catch (e) { console.error(e); }
    };

    const handleClearBroadcast = async () => {
        try {
            await remove(ref(realtimeDb, "broadcast/announcement"));
        } catch (e) { console.error(e); }
    };

    const handleAddQuest = async () => {
        if (!questText.trim()) return;
        try {
            await push(ref(realtimeDb, "globalQuests"), {
                text: questText.trim(),
                timestamp: Date.now(),
                completed: false
            });
            setQuestText("");
        } catch (e) { console.error(e); }
    };

    const handleRemoveQuest = async (id: string) => {
        try {
            await remove(ref(realtimeDb, `globalQuests/${id}`));
        } catch (e) { console.error(e); }
    };

    const handleKickUser = async (uid: string) => {
        if (!confirm("Force this user to logout?")) return;
        try {
            await set(ref(realtimeDb, `forceLogout/${uid}`), Date.now());
        } catch (e) { console.error("Error kicking user", e); }
    };

    const handleToggleBan = async (uid: string, isCurrentlyBanned: boolean) => {
        const msg = isCurrentlyBanned ? "Unban this user?" : "Ban this user? They will be forcibly logged out and blocked.";
        if (!confirm(msg)) return;
        try {
            if (isCurrentlyBanned) {
                await remove(ref(realtimeDb, `bannedUsers/${uid}`));
            } else {
                await set(ref(realtimeDb, `bannedUsers/${uid}`), true);
            }
            setSelectedUser(null); // refresh or close modal
        } catch (e) { console.error("Error toggling ban", e); }
    };

    const handleToggleAdminStatus = async (uid: string, currentRole: string) => {
        const newRole = currentRole === "admin" ? "user" : "admin";
        if (!confirm(`Change this user's role to ${newRole.toUpperCase()}?`)) return;
        try {
            await updateDoc(doc(db, "users", uid), { role: newRole });
            setSelectedUser({ ...selectedUser, role: newRole });
        } catch (e) { 
            console.error(e);
            alert("Role update failed. Make sure Firestore rules allow this operation.");
        }
    };

    const openDetailedUserModal = async (uid: string, userInfo: any) => {
        const performerData = allGamificationUsers.find(p => p.uid === uid) || { xp: 0, level: 5, seconds: 0 };
        let role = "user";
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                role = userDoc.data().role || "user";
            }
        } catch(e) { console.error("Could not fetch user role", e); }
        
        setSelectedUser({
            uid,
            ...userInfo,
            xp: performerData.xp,
            level: performerData.level,
            seconds: performerData.seconds,
            role
        });
    };

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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div 
                    className="rounded-xl border border-gray-800 bg-gray-900 p-6 cursor-pointer hover:bg-gray-800 transition-colors"
                    onClick={() => setIsTotalUsersModalOpen(true)}
                >
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
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                    <h3 className="text-sm font-medium text-gray-400">Total App Focus</h3>
                    <p className="mt-2 text-3xl font-bold text-green-400">
                        {loadingStats ? "..." : formatTimeDetailed(stats.totalFocusTime)}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Active Users Table */}
                <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-gray-900 p-6 flex flex-col">
                    <h2 className="mb-4 text-xl font-bold text-white flex items-center">
                        <Users className="mr-2 h-5 w-5 text-blue-400" />
                        Active Users
                    </h2>
                <div className="overflow-x-auto rounded-lg border border-gray-800">
                    <table className="w-full text-left text-sm text-gray-400 min-w-[600px]">
                        <thead className="bg-gray-950 text-gray-200">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Login Time</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 bg-gray-900">
                            {activeUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                                        No active sessions found.
                                    </td>
                                </tr>
                            ) : (
                                activeUsers.map((u) => {
                                    const userInfo = allUsersData[u.uid] || {};
                                    return (
                                        <tr key={u.uid} className="hover:bg-gray-800/50">
                                            <td className="p-4 font-medium text-white">{userInfo.name || u.name || "Unknown"}</td>
                                            <td className="p-4 text-gray-300">{userInfo.email || u.email || "N/A"}</td>
                                            <td className="p-4">
                                                <div className="flex items-center text-gray-400">
                                                    <Clock className="mr-2 h-4 w-4" />
                                                    {formatDuration(u.last_changed)}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center text-green-500 text-xs font-medium uppercase">
                                                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                                    Online
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleKickUser(u.uid)} className="text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded text-xs transition">
                                                    Kick
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Performers Table */}
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 flex flex-col">
                <h2 className="mb-4 text-xl font-bold text-white flex items-center">
                    <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                    Top Performers
                </h2>
                <div className="overflow-hidden rounded-lg border border-gray-800 flex-1">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-gray-950 text-gray-200">
                            <tr>
                                <th className="p-4">Rank</th>
                                <th className="p-4">User</th>
                                <th className="p-4 text-right">Level</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 bg-gray-900">
                            {topPerformers.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-500 italic">
                                        No data yet.
                                    </td>
                                </tr>
                            ) : (
                                topPerformers.map((u, i) => {
                                    const userInfo = allUsersData[u.uid] || {};
                                    const calcLevel = 5 + Math.floor(u.xp / 100);
                                    return (
                                        <tr key={u.uid} className="hover:bg-gray-800/50">
                                            <td className="p-4 font-bold text-gray-300">#{i + 1}</td>
                                            <td className="p-4 font-medium text-white truncate max-w-[120px]">
                                                {userInfo.name || "Unknown"}
                                                <div className="text-[10px] text-gray-500 font-normal">{formatTimeDetailed(u.seconds)}</div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="inline-flex items-center justify-center h-6 min-w-[24px] rounded bg-purple-500/10 text-purple-400 font-bold text-xs px-1">
                                                    {calcLevel}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
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

            {/* Total Users Modal */}
            {isTotalUsersModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-6 border-b border-gray-800">
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <Users className="mr-2 h-5 w-5 text-blue-400" />
                                All Registered Users
                            </h2>
                            <button 
                                onClick={() => setIsTotalUsersModalOpen(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead className="bg-gray-950 text-gray-200">
                                    <tr>
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">UID</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800 bg-gray-900">
                                    {Object.keys(allUsersData).length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-500 italic">
                                                No users found.
                                            </td>
                                        </tr>
                                    ) : (
                                        Object.entries(allUsersData).map(([uid, userInfo]: [string, any]) => (
                                            <tr key={uid} className="hover:bg-gray-800/50 cursor-pointer transition-colors" onClick={() => openDetailedUserModal(uid, userInfo)}>
                                                <td className="p-4 font-medium text-white">{userInfo.name || "Unknown"}</td>
                                                <td className="p-4 text-gray-300">{userInfo.email || "N/A"}</td>
                                                <td className="p-4 text-xs font-mono text-gray-500">{uid}</td>
                                                <td className="p-4">
                                                    {bannedUsers[uid] ? (
                                                        <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-xs font-bold">BANNED</span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-bold">ACTIVE</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed User View Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
                        <div className="flex bg-gray-950 items-center justify-between p-6 border-b border-gray-800">
                            <h2 className="text-xl font-bold text-white flex items-center">
                                Detailed Profile
                            </h2>
                            <button 
                                onClick={() => setSelectedUser(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
                                    {selectedUser.name ? selectedUser.name[0].toUpperCase() : "U"}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        {selectedUser.name || "Unknown User"}
                                        {bannedUsers[selectedUser.uid] && <Ban className="h-4 w-4 text-red-500" />}
                                    </h3>
                                    <p className="text-gray-400 text-sm">{selectedUser.email || "No email"}</p>
                                    <p className="text-xs font-mono text-gray-600 mt-1">ID: {selectedUser.uid}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 border-y border-gray-800 py-4">
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-1">Level</p>
                                    <p className="text-2xl font-bold text-purple-400">{selectedUser.level}</p>
                                </div>
                                <div className="text-center border-l border-gray-800">
                                    <p className="text-xs text-gray-500 mb-1">XP</p>
                                    <p className="text-2xl font-bold text-yellow-500">{selectedUser.xp}</p>
                                </div>
                                <div className="text-center border-l border-gray-800">
                                    <p className="text-xs text-gray-500 mb-1">Total Focus</p>
                                    <p className="text-lg font-bold text-green-400 leading-8">{formatTimeDetailed(selectedUser.seconds)}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Moderation Controls</h4>
                                
                                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-950">
                                    <div>
                                        <p className="text-sm font-medium text-white">Administrator Role</p>
                                        <p className="text-xs text-gray-500">Grant full access to the admin dashboard.</p>
                                    </div>
                                    <button 
                                        onClick={() => handleToggleAdminStatus(selectedUser.uid, selectedUser.role)}
                                        className={`px-4 py-2 rounded text-xs font-bold transition-colors ${selectedUser.role === 'admin' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'}`}
                                    >
                                        {selectedUser.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg border border-red-900/30 bg-red-500/5">
                                    <div>
                                        <p className="text-sm font-medium text-red-400">Account Ban</p>
                                        <p className="text-xs text-red-500/60">Immediately block access to MindTrack.</p>
                                    </div>
                                    <button 
                                        onClick={() => handleToggleBan(selectedUser.uid, !!bannedUsers[selectedUser.uid])}
                                        className={`px-4 py-2 rounded text-xs font-bold transition-colors flex items-center gap-1 ${bannedUsers[selectedUser.uid] ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'}`}
                                    >
                                        <AlertTriangle className="h-3 w-3" />
                                        {bannedUsers[selectedUser.uid] ? 'Unban User' : 'Ban User'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Communication & Quests Split */}
            <div className="grid gap-6 lg:grid-cols-2 mt-6">
                {/* Broadcasts */}
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 flex flex-col">
                    <h2 className="mb-4 text-xl font-bold text-white flex items-center">
                        <Megaphone className="mr-2 h-5 w-5 text-orange-400" />
                        Global Broadcasts
                    </h2>
                    {currentBroadcast ? (
                        <div className="mb-4 p-4 rounded-lg border border-orange-500/20 bg-orange-500/10">
                            <p className="text-orange-400 font-medium text-sm mb-1">Active Announcement:</p>
                            <p className="text-white">{currentBroadcast.message}</p>
                            <p className="text-xs text-orange-500/60 mt-2">{formatDuration(currentBroadcast.timestamp)}</p>
                            <button onClick={handleClearBroadcast} className="mt-3 text-xs bg-red-500/20 text-red-500 px-3 py-1 rounded hover:bg-red-500/30 transition">
                                Clear Announcement
                            </button>
                        </div>
                    ) : (
                        <div className="mb-4 p-4 rounded-lg border border-gray-800 bg-gray-950/50 text-gray-500 text-sm text-center italic">
                            No active announcements.
                        </div>
                    )}
                    
                    <div className="mt-auto pt-4 border-t border-gray-800">
                        <label className="text-sm text-gray-400 block mb-2">New Announcement</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={broadcastMessage}
                                onChange={(e) => setBroadcastMessage(e.target.value)}
                                placeholder="Type a message to all users..."
                                className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                            />
                            <button 
                                onClick={handleSendBroadcast}
                                className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg flex items-center justify-center transition"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quests */}
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 flex flex-col">
                    <h2 className="mb-4 text-xl font-bold text-white flex items-center">
                        <Target className="mr-2 h-5 w-5 text-green-400" />
                        Dynamic Quests
                    </h2>
                    
                    <div className="flex-1 overflow-y-auto max-h-[250px] mb-4 space-y-2">
                        {globalQuests.length === 0 ? (
                            <p className="text-gray-500 text-sm italic py-4 text-center">No global quests active.</p>
                        ) : (
                            globalQuests.map((quest) => (
                                <div key={quest.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-950 border border-gray-800">
                                    <span className="text-sm text-gray-200">{quest.text}</span>
                                    <button onClick={() => handleRemoveQuest(quest.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-800">
                        <label className="text-sm text-gray-400 block mb-2">Add Global Quest</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={questText}
                                onChange={(e) => setQuestText(e.target.value)}
                                placeholder="e.g. Meditate for 10 minutes..."
                                className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                            />
                            <button 
                                onClick={handleAddQuest}
                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg flex items-center justify-center transition"
                            >
                                <Target className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
