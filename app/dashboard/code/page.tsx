import CodeEditor from "@/components/CodeEditor";

export default function CodePage() {
    return (
        <div className="flex h-[calc(100dvh-6rem)] flex-col gap-4">
            <div className="mb-2 shrink-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coding Arena</h1>
                <p className="text-gray-600 dark:text-gray-400">Practice algorithms and solve problems in real-time.</p>
            </div>
            <div className="flex-1 min-h-0 w-full relative">
                <CodeEditor />
            </div>
        </div>
    );
}
