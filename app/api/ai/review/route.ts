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
            systemInstruction: "You are an expert AI pair programmer for MindTrack. Provide concise, helpful code reviews, find bugs, and suggest improvements. Return your response in raw format without any markdown wrapper text unless it is helpful for code formatting."
        });

        const { code, language, instruction } = await req.json();

        if (!code) {
             return NextResponse.json({ error: 'Code is required for review.' }, { status: 400 });
        }

        const prompt = `Here is some ${language || 'code'} written by the user:\n\n${code}\n\nUser Question/Instruction: ${instruction || 'Please review this code for bugs, logic errors, and best practices.'}\n\nPlease provide a short, specific, and actionable review.`;

        const result = await model.generateContent(prompt);
        const review = result.response.text();

        return NextResponse.json({ review });
    } catch (error: any) {
        console.error('Code Review AI Error:', error);
        return NextResponse.json({ error: 'Failed to generate code review' }, { status: 500 });
    }
}
