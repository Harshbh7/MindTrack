import FocusTimer from "@/components/FocusTimer";

export default function TimerPage() {
    return (
        <div className="flex h-full flex-col items-center justify-center space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white">Focus Timer</h1>
                <p className="mt-2 text-gray-400">Keep your face in the camera frame to track your study time.</p>
            </div>
            <FocusTimer />
        </div>
    );
}
