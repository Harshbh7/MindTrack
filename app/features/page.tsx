import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function VerificationPage() {
    const features = [
        { name: "Authentication (Login/Signup)", path: "/login" },
        { name: "Protected Routes (Dashboard)", path: "/dashboard" },
        { name: "AI Focus Timer (Webcam)", path: "/dashboard/timer" },
        { name: "Study Rooms (Lobby)", path: "/dashboard/room" },
        { name: "Collaborative Chat", path: "/dashboard/room" },
        { name: "Code Editor (Monaco)", path: "/dashboard/code" },
        { name: "AI Tutor (OpenAI)", path: "/dashboard/learning" },
        { name: "Admin Dashboard", path: "/dashboard/admin" },
    ];

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <h1 className="text-3xl font-bold mb-8 text-center text-blue-400">MindTrack Features Verification</h1>
            <div className="max-w-2xl mx-auto grid gap-4">
                {features.map((feature, idx) => (
                    <Link key={idx} href={feature.path} className="block group">
                        <div className="p-4 rounded-xl border border-gray-800 bg-gray-900 group-hover:border-blue-500 transition-all flex items-center justify-between">
                            <span className="font-semibold text-lg group-hover:text-blue-400 transition-colors">
                                {feature.name}
                            </span>
                            <CheckCircle className="h-6 w-6 text-green-500" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
