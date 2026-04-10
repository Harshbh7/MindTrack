import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
        }

        const { topic } = await req.json();

        if (!topic) {
            return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: "You are a specialized study assistant. The user is watching a video about a specific topic. Your goal is to provide a structured, concise summary and a 'cheat sheet' of key concepts related to that topic to help them study while watching. Use Markdown formatting."
        });

        const prompt = `Provide a study summary and key concepts for this topic: ${topic}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return NextResponse.json({ summary: responseText });
    } catch (error: any) {
        console.error('AI Video Summary Error:', error);
        return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }
}
