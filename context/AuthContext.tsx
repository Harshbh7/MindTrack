"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db, realtimeDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref, onValue, set, onDisconnect, serverTimestamp, push } from "firebase/database";

import { signOut } from "firebase/auth";

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, isAdmin: false, loading: true, logout: async () => { } });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubConnected: (() => void) | undefined;
        let unsubBanned: (() => void) | undefined;
        let unsubForceLogout: (() => void) | undefined;

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                if (currentUser.email === "harshbh20102@gmail.com") {
                    setIsAdmin(true);
                } else {
                    try {
                        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                        if (userDoc.exists() && userDoc.data().role === "admin") {
                            setIsAdmin(true);
                        } else {
                            setIsAdmin(false);
                        }
                    } catch (error: any) {
                        if (error.code !== 'unavailable' && !error.message?.includes('offline')) {
                            console.error("Error fetching user role", error);
                        }
                        setIsAdmin(false);
                    }
                }

                // Security Check: Ban & Force Kick
                const bannedRef = ref(realtimeDb, `bannedUsers/${currentUser.uid}`);
                unsubBanned = onValue(bannedRef, (snap) => {
                    if (snap.val() === true) {
                        alert("Your account has been restricted by an administrator.");
                        signOut(auth);
                    }
                });

                const forceLogoutRef = ref(realtimeDb, `forceLogout/${currentUser.uid}`);
                unsubForceLogout = onValue(forceLogoutRef, (snap) => {
                    const kickTime = snap.val();
                    if (kickTime && kickTime > Date.now() - 15000) { // Kicked within last 15 seconds
                        alert("Your session was terminated by an administrator.");
                        signOut(auth);
                    }
                });

                const userStatusDatabaseRef = ref(realtimeDb, `/sessions/${currentUser.uid}`);
                const isOfflineForDatabase = {
                    state: 'offline',
                    last_changed: serverTimestamp(),
                };
                
                const connectedRef = ref(realtimeDb, '.info/connected');
                unsubConnected = onValue(connectedRef, (snap) => {
                    if (snap.val() === true) {
                        onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
                            set(userStatusDatabaseRef, {
                                state: 'online',
                                last_changed: serverTimestamp(),
                                email: currentUser.email || "",
                                name: currentUser.displayName || "Unknown User",
                            });
                        });
                    }
                });

            } else {
                setIsAdmin(false);
                if (unsubConnected) unsubConnected();
                if (unsubBanned) unsubBanned();
                if (unsubForceLogout) unsubForceLogout();
            }
            setLoading(false);
        });

        return () => {
            unsubscribe();
            if (unsubConnected) unsubConnected();
            if (unsubBanned) unsubBanned();
            if (unsubForceLogout) unsubForceLogout();
        };
    }, []);

    const logout = async () => {
        if (user) {
            try {
                const userStatusDatabaseRef = ref(realtimeDb, `/sessions/${user.uid}`);
                await set(userStatusDatabaseRef, {
                    state: 'offline',
                    last_changed: serverTimestamp(),
                });
            } catch (err) {
                console.error("Error setting offline status on logout", err);
            }
        }
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
