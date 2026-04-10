import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
        }

        const { text, count = 5 } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" },
            systemInstruction: "You are a flashcard generator for MindTrack. Given a block of text, extract the most important concepts and create concise Q&A pairs for active recall. Return a JSON array of objects with 'front' and 'back' keys."
        });

        const prompt = `Generate ${count} flashcards from the following text:\n\n${text}\n\nReturn the output as a JSON array like: [{"front": "Question", "back": "Answer"}]`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Robust JSON cleaning
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
        
        try {
            const flashcards = JSON.parse(jsonStr);
            return NextResponse.json({ flashcards });
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError, 'Raw response:', responseText);
            return NextResponse.json({ error: 'AI returned invalid formatting' }, { status: 500 });
        }
    } catch (error: any) {
        console.error('AI Flashcard Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate flashcards' }, { status: 500 });
    }
}
