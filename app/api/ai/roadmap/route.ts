import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
        }

        const { goal } = await req.json();

        if (!goal) {
            return NextResponse.json({ error: 'Goal is required' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" },
            systemInstruction: "You are a learning architect for MindTrack. Create a detailed, step-by-step study roadmap for the given goal. Break it down into 5-8 logical phases. Each phase MUST have 'title', 'description', and 'estimatedTime' fields. Return a JSON object with a 'phases' key containing the array of phase objects."
        });

        const prompt = `Create a study roadmap for the goal: "${goal}". Provide specific and actionable steps.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        
        try {
            // Try to parse as direct JSON first
            let data = JSON.parse(responseText);
            
            // If it's a raw array, wrap it. If it has a 'phases' key, use that.
            let phases = Array.isArray(data) ? data : (data.phases || data.steps || []);
            
            return NextResponse.json({ phases });
        } catch (parseError) {
            // Fallback for markdown-wrapped JSON
            const jsonMatch = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
            
            try {
                const data = JSON.parse(jsonStr);
                let phases = Array.isArray(data) ? data : (data.phases || data.steps || []);
                return NextResponse.json({ phases });
            } catch (innerError) {
                console.error('JSON Extraction Error:', innerError, 'Raw:', responseText);
                return NextResponse.json({ error: 'AI returned invalid formatting. Please try again.' }, { status: 500 });
            }
        }
    } catch (error: any) {
        console.error('AI Roadmap Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate roadmap' }, { status: 500 });
    }
}
