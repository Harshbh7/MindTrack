"use client";

import { useState, useEffect, useRef } from "react";
import Editor, { loader, useMonaco } from "@monaco-editor/react";
import { Play, Code as CodeIcon, RotateCw, Bot, Monitor, Maximize2, Terminal, Save, Zap, ZapOff, Layout, ChevronRight, MessageSquare, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MindSwal, Toast } from "@/lib/swal";

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
    const monaco = useMonaco();
    const [language, setLanguage] = useState("web");
    const [webTab, setWebTab] = useState<WebTab>("html");
    const [autoRun, setAutoRun] = useState(true);
    const [showAiSidebar, setShowAiSidebar] = useState(false);
    const [theme, setTheme] = useState("vs-dark");

    // State for standard languages
    const [code, setCode] = useState("");

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

    // Load custom theme
    useEffect(() => {
        if (monaco) {
            monaco.editor.defineTheme('mindtrack-vision', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                    { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
                    { token: 'keyword', foreground: 'bd93f9' },
                    { token: 'string', foreground: 'f1fa8c' },
                    { token: 'number', foreground: '8be9fd' },
                    { token: 'operator', foreground: 'ff79c6' },
                ],
                colors: {
                    'editor.background': '#0f111a',
                    'editor.foreground': '#e6edf3',
                    'editor.lineHighlightBackground': '#1b1e2e',
                    'editorCursor.foreground': '#bd93f9',
                    'editorLineNumber.foreground': '#4b5563',
                    'editor.selectionBackground': '#3e4451',
                    'editorIndentGuide.background': '#1f2937',
                    'editorIndentGuide.activeBackground': '#374151',
                }
            });
            setTheme('mindtrack-vision');
        }
    }, [monaco]);

    // Code Persistence & Boilerplate Loading
    useEffect(() => {
        const savedWeb = localStorage.getItem('bt_arena_web');
        const savedCode = localStorage.getItem(`bt_arena_${language}`);

        if (language === "web") {
            if (savedWeb) setWebFiles(JSON.parse(savedWeb));
            else setWebFiles({ html: BOILERPLATES.web_html, css: BOILERPLATES.web_css, javascript: BOILERPLATES.web_js });
        } else {
            if (savedCode) setCode(savedCode);
            else setCode(BOILERPLATES[language] || "");
        }
        setOutput("");
    }, [language]);

    // Auto-Run effect
    useEffect(() => {
        if (autoRun && language === "web") {
            const timer = setTimeout(() => {
                handleRunCode();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [webFiles, autoRun, language]);

    const activeCode = language === "web" ? webFiles[webTab] : code;

    const handleEditorChange = (value: string | undefined) => {
        const newVal = value || "";
        if (language === "web") {
            const updated = { ...webFiles, [webTab]: newVal };
            setWebFiles(updated);
            localStorage.setItem('bt_arena_web', JSON.stringify(updated));
        } else {
            setCode(newVal);
            localStorage.setItem(`bt_arena_${language}`, newVal);
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
        setShowAiSidebar(true);
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
            if (data.review) setAiSuggestion(data.review);
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
        <div className="flex h-full w-full flex-col gap-4 overflow-hidden">
            {/* Cyber IDE Header */}
            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-xl p-4 sm:flex-row sm:items-center sm:justify-between shrink-0 shadow-2xl">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <CodeIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex flex-col">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer hover:text-blue-400 transition-colors"
                        >
                            <option value="web" className="bg-gray-900">Web Projects</option>
                            <option value="python" className="bg-gray-900">Python 3.10</option>
                            <option value="cpp" className="bg-gray-900">C++ GCC 13</option>
                            <option value="java" className="bg-gray-900">Java JDK 21</option>
                        </select>
                        <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none mt-1">Environment Ready</span>
                    </div>

                    {language === "web" && (
                        <div className="flex items-center gap-1 bg-black/40 rounded-xl p-1 ml-2 border border-white/5">
                            {(["html", "css", "javascript"] as WebTab[]).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setWebTab(tab)}
                                    className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all uppercase tracking-tighter ${webTab === tab 
                                        ? "bg-blue-600 shadow-lg shadow-blue-500/20 text-white" 
                                        : "text-gray-500 hover:text-white"
                                        }`}
                                >
                                    {tab === "javascript" ? "JS" : tab}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {language === "web" && (
                         <button
                            onClick={() => setAutoRun(!autoRun)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                                autoRun ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-gray-800 border-gray-700 text-gray-500'
                            }`}
                        >
                            {autoRun ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                            <span>{autoRun ? "Auto-Sync" : "Manual"}</span>
                        </button>
                    )}

                    <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block" />

                    <button
                        onClick={handleAiReview}
                        disabled={isReviewing}
                        className="group flex items-center space-x-2 rounded-xl bg-purple-600/20 px-4 py-2 text-xs font-black text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                        <Bot className={`h-4 w-4 ${isReviewing ? 'animate-bounce' : 'group-hover:rotate-12 transition-transform'}`} />
                        <span>AI REVIEW</span>
                    </button>

                    <button
                        onClick={handleRunCode}
                        disabled={isRunning}
                        className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-black text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                        <Play className="h-4 w-4" />
                        <span>{isRunning ? "RUNNING" : "EXECUTE"}</span>
                    </button>
                    
                    <button
                        onClick={resetCode}
                        className="rounded-xl p-2 bg-gray-800 border border-gray-700 text-gray-400 hover:text-white transition-colors"
                        title="Reset Code"
                    >
                        <RotateCw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex gap-4 relative">
                {/* Editor Area */}
                <div className="flex-1 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f111a] shadow-2xl relative">
                    <div className="bg-black/40 px-4 py-2 border-b border-white/5 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                           <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                           </div>
                           <span className="ml-4 text-[10px] font-black text-gray-500 uppercase tracking-widest tracking-widest">{language === 'web' ? webTab : language}.file</span>
                        </div>
                        <Save className="w-3 h-3 text-gray-700" />
                    </div>
                    <div className="flex-1">
                        <Editor
                            height="100%"
                            language={language === "web" ? webTab : language}
                            value={activeCode}
                            theme={theme}
                            onChange={handleEditorChange}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                fontFamily: "'JetBrains Mono', monospace",
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 16, bottom: 16 },
                                renderLineHighlight: 'all',
                                roundedSelection: true,
                                scrollbar: {
                                    vertical: 'hidden',
                                    horizontal: 'hidden'
                                }
                            }}
                        />
                    </div>
                </div>

                {/* AI Sidebar - Animated */}
                <AnimatePresence>
                    {showAiSidebar && (
                        <motion.div 
                            initial={{ x: 400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 400, opacity: 0 }}
                            className="absolute lg:relative right-0 top-0 h-full w-[350px] bg-gray-900/80 backdrop-blur-2xl border-l border-white/10 z-50 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
                        >
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-purple-600/10">
                                <div className="flex items-center gap-2 text-purple-400">
                                    <Sparkles className="w-5 h-5" />
                                    <span className="font-black text-xs uppercase tracking-widest">AI Debugger</span>
                                </div>
                                <button onClick={() => setShowAiSidebar(false)} className="text-gray-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                                {isReviewing ? (
                                    <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
                                        <p className="text-[10px] font-black uppercase tracking-tighter text-purple-400">Analyzing Architecture...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-purple-500/5 rounded-xl border border-purple-500/20 p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <MessageSquare className="w-3 h-3 text-purple-400" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Analysis Results</span>
                                            </div>
                                            <div className="text-sm text-gray-200 leading-relaxed font-medium">
                                                {aiSuggestion || "Select 'AI Review' to analyze your code for patterns and bugs."}
                                            </div>
                                        </div>
                                        
                                        {aiSuggestion && (
                                            <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Advanced Features Coming Soon</span>
                                                <p className="text-[11px] text-gray-400 mt-1 italic">Optimization scripts and auto-fixes will be available in the next core update.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Output Area */}
                <div className="hidden lg:flex flex-col w-[40%] rounded-2xl border border-white/10 bg-gray-950 overflow-hidden shadow-2xl">
                    <div className="border-b border-white/5 p-4 bg-black/40 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${language === 'web' ? 'bg-amber-500/10' : 'bg-blue-500/10'}`}>
                                {language === "web" ? <Monitor className="w-3.5 h-3.5 text-amber-500" /> : <Terminal className="w-3.5 h-3.5 text-blue-500" />}
                            </div>
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                {language === "web" ? "Liquid Preview" : "Kernel Console"}
                            </h3>
                        </div>
                        {language === 'web' && <Maximize2 className="w-3 h-3 text-gray-600 hover:text-white cursor-pointer" />}
                    </div>

                    <div className="flex-1 relative">
                        {language === "web" ? (
                            <div className="h-full w-full bg-white relative">
                                {htmlPreview ? (
                                    <iframe
                                        srcDoc={htmlPreview}
                                        className="h-full w-full border-none bg-white"
                                        title="HTML Preview"
                                    />
                                ) : (
                                    <div className="p-10 flex flex-col items-center justify-center h-full text-center space-y-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Monitor className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p className="text-gray-400 text-sm font-medium">Render queue empty.<br/><span className="text-xs text-gray-500">Enable Auto-Sync or press Execute.</span></p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full w-full overflow-auto p-6 font-mono text-sm leading-relaxed custom-scrollbar">
                                {output ? (
                                    <div className="space-y-2">
                                        <span className="text-emerald-500/50 uppercase text-[9px] font-black tracking-widest">Process Output:</span>
                                        <div className="text-emerald-400/90 [text-shadow:_0_0_10px_rgba(52,211,153,0.3)]">{output}</div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 filter grayscale">
                                        <Terminal className="w-12 h-12 mb-4" />
                                        <span className="text-xs uppercase tracking-widest font-black italic">Waiting for syscall...</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
