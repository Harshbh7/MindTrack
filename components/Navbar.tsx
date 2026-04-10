import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth, realtimeDb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { useRouter } from "next/navigation";
import { LogOut, User, Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
    onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [displayName, setDisplayName] = useState("");

    useEffect(() => {
        if (!user) return;

        // Listen to name changes in Realtime DB
        const nameRef = ref(realtimeDb, `allUsers/${user.uid}/name`);
        const unsubscribe = onValue(nameRef, (snapshot) => {
            const name = snapshot.val();
            if (name) {
                setDisplayName(name);
            } else {
                setDisplayName(user.displayName || user.email || "User");
            }
        });

        return () => unsubscribe();
    }, [user]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (err) {
            console.error("Failed to logout", err);
        }
    };

    return (
        <nav className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 md:px-6 py-4 transition-colors">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
                {user && (
                    <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <User className="h-4 w-4" />
                        <span>{displayName}</span>
                    </div>
                )}
                <ThemeToggle />
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 rounded-md bg-red-600/10 px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-600/20"
                >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden md:inline">Logout</span>
                </button>
            </div>
        </nav>
    );
}
