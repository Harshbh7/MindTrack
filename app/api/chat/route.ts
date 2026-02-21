import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: "You are an AI Tutor for MindTrack. You help students with their studies, explain concepts, and solve coding doubts. Be encouraging and concise."
        });

        const { messages } = await req.json();

        if (!messages) {
            return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
        }

        // Format history for Gemini API, filtering out the frontend's hardcoded assistant greeting
        // to prevent role-alternation validation errors
        const history = messages
            .slice(0, -1)
            .filter((m: any) => m.content !== "Hello! I'm your AI Tutor. Ask me anything about your studies or code.")
            .map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));

        const currentMessage = messages[messages.length - 1].content;

        const chat = model.startChat({
            history: history
        });

        const result = await chat.sendMessage(currentMessage);
        const reply = result.response.text();

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error('Gemini API Error:', error);
        const fs = require('fs');
        const serializedError = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
        fs.writeFileSync('gemini_error.txt', Object.keys(error).length ? serializedError : error.toString());
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
