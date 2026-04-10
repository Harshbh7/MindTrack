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
            systemInstruction: "You are a learning architect. Create a detailed, step-by-step study roadmap for the given goal. Break it down into 5-8 logical phases. Each phase should have a 'title', 'description', and 'estimatedTime'. Return a JSON array of these phase objects."
        });

        const prompt = `Create a study roadmap for: ${goal}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Robust JSON cleaning
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
        
        try {
            const phases = JSON.parse(jsonStr);
            return NextResponse.json({ phases });
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError, 'Raw response:', responseText);
            return NextResponse.json({ error: 'AI returned invalid formatting' }, { status: 500 });
        }
    } catch (error: any) {
        console.error('AI Roadmap Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate roadmap' }, { status: 500 });
    }
}
