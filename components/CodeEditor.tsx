"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play, Code as CodeIcon, RotateCw, Bot, Monitor } from "lucide-react";

const BOILERPLATES: Record<string, string> = {
    web_html: "<!DOCTYPE html>\n<html>\n<head>\n  <title>MindTrack Web</title>\n</head>\n<body>\n  <h1>Hello from MindTrack!</h1>\n  <button id=\"btn\">Click Me</button>\n</body>\n</html>",
    web_css: "/* Write your CSS here */\nbody {\n  font-family: sans-serif;\n  text-align: center;\n  margin-top: 50px;\n  background: #f0f0f0;\n}\nh1 { color: #3b82f6; }\nbutton { padding: 10px 20px; border-radius: 8px; border: none; background: #3b82f6; color: white; cursor: pointer; }",
    web_js: "// Write your JavaScript here\ndocument.getElementById('btn').addEventListener('click', () => {\n  alert('Button clicked!');\n});",
    python: "# Write your code here\nprint('Hello, MindTrack!')",
    cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello, MindTrack!\" << endl;\n    return 0;\n}",
    java: "class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, MindTrack!\");\n    }\n}"
};

type WebTab = "html" | "css" | "javascript";

export default function CodeEditor() {
    const [language, setLanguage] = useState("web");
    const [webTab, setWebTab] = useState<WebTab>("html");

    // State for standard languages
    const [code, setCode] = useState(BOILERPLATES.python);

    // State for Web project (HTML/CSS/JS combined)
    const [webFiles, setWebFiles] = useState({
        html: BOILERPLATES.web_html,
        css: BOILERPLATES.web_css,
        javascript: BOILERPLATES.web_js
    });

    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [htmlPreview, setHtmlPreview] = useState("");

    // AI State
    const [isReviewing, setIsReviewing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState("");

    useEffect(() => {
        if (language !== "web") {
            setCode(BOILERPLATES[language] || "");
        }
        setOutput("");
        setHtmlPreview("");
    }, [language]);

    const activeCode = language === "web" ? webFiles[webTab] : code;

    const handleEditorChange = (value: string | undefined) => {
        if (language === "web") {
            setWebFiles(prev => ({ ...prev, [webTab]: value || "" }));
        } else {
            setCode(value || "");
        }
    };

    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput("Running...");

        if (language === "web") {
            // Combine HTML, CSS, JS into a single document
            const combinedHtml = `
                ${webFiles.html.replace('</head>', `<style>${webFiles.css}</style></head>`)}
                <script>
                    ${webFiles.javascript}
                </script>
            `;
            setHtmlPreview(combinedHtml);
            setOutput("Rendered Web Project preview.");
            setIsRunning(false);
            return;
        }

        // Use Wandbox for Java, C++, Python
        try {
            const COMPILER_MAP: Record<string, string> = {
                "python": "cpython-3.10.15",
                "cpp": "gcc-13.2.0",
                "java": "openjdk-jdk-21+35"
            };

            const reqBody = {
                compiler: COMPILER_MAP[language] || "gcc-13.2.0",
                code: code,
                save: false
            };

            const res = await fetch("https://wandbox.org/api/compile.json", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reqBody)
            });

            const data = await res.json();

            if (data.status === "0") {
                setOutput(data.program_message || "Process exited with no output.");
            } else {
                setOutput(data.compiler_error || data.program_error || "Execution error.");
            }
        } catch (err: any) {
            setOutput("Error connecting to execution server: " + err.message);
        } finally {
            setIsRunning(false);
        }
    };

    const handleAiReview = async () => {
        setIsReviewing(true);
        setAiSuggestion("");

        try {
            const codeToReview = language === "web"
                ? `HTML:\n${webFiles.html}\n\nCSS:\n${webFiles.css}\n\nJS:\n${webFiles.javascript}`
                : code;

            const res = await fetch('/api/ai/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codeToReview, language })
            });
            const data = await res.json();
            setAiSuggestion(data.suggestion);
        } catch (err) {
            setAiSuggestion("Failed to get AI review. Please try again.");
        } finally {
            setIsReviewing(false);
        }
    };

    const resetCode = () => {
        if (language === "web") {
            setWebFiles({
                html: BOILERPLATES.web_html,
                css: BOILERPLATES.web_css,
                javascript: BOILERPLATES.web_js
            });
            setHtmlPreview("");
            setOutput("");
        } else {
            setCode(BOILERPLATES[language] || "");
            setOutput("");
        }
    };

    return (
        <div className="flex h-full w-full flex-col gap-4">
            {/* Editor Controls */}
            <div className="flex flex-col gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
                <div className="flex flex-wrap items-center gap-4">
                    <CodeIcon className="h-6 w-6 text-blue-400" />
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="rounded-lg border border-gray-700 bg-gray-800 p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="web">Web (HTML/CSS/JS)</option>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                    </select>

                    {language === "web" && (
                        <div className="flex bg-gray-800 rounded-lg p-1 ml-2">
                            {(["html", "css", "javascript"] as WebTab[]).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setWebTab(tab)}
                                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${webTab === tab ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                                        }`}
                                >
                                    {tab === "javascript" ? "JS" : tab.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleAiReview}
                        disabled={isReviewing}
                        className="flex items-center space-x-2 rounded-lg bg-pink-600/20 px-4 py-2 text-sm font-semibold text-pink-400 hover:bg-pink-600/30 transition-colors disabled:opacity-50"
                    >
                        {isReviewing ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-pink-400 border-t-transparent"></div>
                        ) : (
                            <Bot className="h-4 w-4" />
                        )}
                        <span>{isReviewing ? "Analyzing..." : "AI Review"}</span>
                    </button>

                    <button
                        onClick={resetCode}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
                        title="Reset Code"
                    >
                        <RotateCw className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleRunCode}
                        disabled={isRunning}
                        className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-500 transition-colors disabled:opacity-50"
                    >
                        <Play className="h-4 w-4" />
                        <span>{isRunning ? "Running..." : "Run Code"}</span>
                    </button>
                </div>
            </div>

            <div className="grid flex-1 min-h-0 gap-4 lg:grid-cols-2">
                {/* Editor Area */}
                <div className="flex flex-col overflow-hidden rounded-xl border border-gray-800 bg-[#1e1e1e] relative min-h-[40vh] lg:min-h-0">
                    <Editor
                        height="100%"
                        language={language === "web" ? webTab : language}
                        value={activeCode}
                        theme="vs-dark"
                        onChange={handleEditorChange}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                        }}
                    />

                    {/* AI Feedback Overlay */}
                    {aiSuggestion && (
                        <div className="absolute bottom-4 right-4 max-w-md bg-gray-900/95 backdrop-blur-sm border border-pink-500/50 rounded-xl p-4 shadow-2xl animate-in slide-in-from-bottom-2 z-20">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2 text-pink-400 font-bold">
                                    <Bot className="h-4 w-4" />
                                    <span>AI Feedback</span>
                                </div>
                                <button onClick={() => setAiSuggestion("")} className="text-gray-500 hover:text-white">✕</button>
                            </div>
                            <div className="text-sm text-gray-200 leading-relaxed max-h-60 overflow-y-auto pr-2">
                                {aiSuggestion.split('\n').map((line, i) => (
                                    <p key={i} className={line.trim() === '' ? 'h-2' : 'mb-1'}>
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Output Area */}
                <div className="flex flex-col rounded-xl border border-gray-800 bg-gray-900 overflow-hidden min-h-[40vh] lg:min-h-0">
                    <div className="border-b border-gray-800 p-3 bg-gray-900 flex justify-between items-center shrink-0">
                        <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                            {language === "web" ? <Monitor className="w-4 h-4" /> : <CodeIcon className="w-4 h-4" />}
                            {language === "web" ? "Live Preview" : "Console Output"}
                        </h3>
                    </div>

                    {language === "web" ? (
                        <div className="flex-1 bg-white relative">
                            {htmlPreview ? (
                                <iframe
                                    srcDoc={htmlPreview}
                                    className="absolute inset-0 w-full h-full border-none bg-white"
                                    title="HTML Preview"
                                />
                            ) : (
                                <div className="p-4 flex items-center justify-center h-full text-gray-500 text-sm">
                                    Click "Run Code" to compile and view your Web preview...
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto p-4 font-mono text-sm text-gray-300 whitespace-pre-wrap bg-gray-950">
                            {output || <span className="text-gray-600">Run code to see output...</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
