import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
    suggestion: string;
};

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ suggestion: 'Method not allowed' });
    }

    const { code, language } = req.body;

    // Simulate AI Analysis with Heuristics
    const suggestion = analyzeCode(code, language);

    // Simulate network delay
    setTimeout(() => {
        res.status(200).json({ suggestion });
    }, 1000);
}

function analyzeCode(code: string, language: string): string {
    if (!code || code.trim().length === 0) {
        return "Please write some code first so I can review it!";
    }

    const lines = code.split('\n');
    const feedback: string[] = [];

    // --- JavaScript Checks ---
    if (language === 'javascript' || language === 'typescript') {
        if (code.includes('var ')) {
            feedback.push("⚠️ **Modern JS:** Use `const` or `let` instead of `var` to avoid scope hoising issues.");
        }
        if (code.includes('==') && !code.includes('===')) {
            feedback.push("⚠️ **Equality:** Use `===` (strict equality) to avoid type coercion bugs.");
        }
        if (code.includes('console.log')) {
            feedback.push("💡 **Tip:** Don't forget to remove `console.log` statements before deploying to production.");
        }
        // Basic syntax check: mismatched brackets (very scanning based)
        const openBraces = (code.match(/\{/g) || []).length;
        const closeBraces = (code.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            feedback.push(`🚫 **Syntax Error:** Mismatched curly braces. Found ${openBraces} '{' and ${closeBraces} '}'.`);
        }
    }

    // --- Python Checks ---
    if (language === 'python') {
        if (code.includes('print ') && !code.includes('print(')) {
            feedback.push("🚫 **Syntax Error:** Python 3 requires parentheses for `print()`. Example: `print('Hello')`");
        }

        // Check for missing colons in control structures
        const controlStructures = ['if', 'else', 'elif', 'for', 'while', 'def', 'class'];
        lines.forEach((line, idx) => {
            const trimmed = line.trim();
            if (controlStructures.some(kw => trimmed.startsWith(kw + ' ')) && !trimmed.endsWith(':')) {
                // Ignore overly simple check failures (like 'else' on its own line without colon)
                if (trimmed.length > 3 && !trimmed.endsWith(':')) {
                    feedback.push(`🚫 **Syntax Error (Line ${idx + 1}):** Missing colon \`:\` at the end of the statement.`);
                }
            }
        });

        if (code.includes('==') === false && code.includes('=') && !code.includes('def ')) {
            // Heuristic: Using assignment in condition? Hard to tell without parsing. 
            // Skipping for now to avoid false positives.
        }
    }

    // --- C++ Checks ---
    if (language === 'cpp') {
        if (code.includes('void main')) {
            feedback.push("🚫 **Standard C++:** `main` function must return `int`. Use `int main()`.");
        }
        if (code.includes('using namespace std;')) {
            feedback.push("⚠️ **Best Practice:** Avoid `using namespace std;` in larger projects to prevent name collisions. Use `std::cout`, etc.");
        }
        if (!code.includes('#include <iostream>') && (code.includes('cout') || code.includes('cin'))) {
            feedback.push("🚫 **Syntax Error:** Missing `#include <iostream>` for input/output operations.");
        }
        // Check for semicolons
        lines.forEach((line) => {
            const trimmed = line.trim();
            if (trimmed.length > 0 && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') && !trimmed.startsWith('#') && !trimmed.startsWith('//')) {
                // Very rough heuristic
                if (!trimmed.includes('if') && !trimmed.includes('for') && !trimmed.includes('while') && !trimmed.includes('else')) {
                    // Potential missing semi-colon
                }
            }
        });
    }

    // Generic Security
    if (code.includes('eval(')) {
        feedback.push("☠️ **Critical Security:** Never use `eval()`. It allows execution of arbitrary code.");
    }

    if (feedback.length === 0) {
        return "✅ Code looks good! No obvious syntax or style errors detected by the mock engine.";
    }

    return feedback.join('\n\n');
}
