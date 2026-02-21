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
            systemInstruction: "You are an expert Computer Science tutor for MindTrack. You generate structured, progressive daily study tasks for topics like Data Structures, Algorithms, Databases, System Design, Web Development, etc. \n\nYou ALWAYS respond with strictly valid JSON matching this array schema: [{ \"id\": string, \"subject\": string, \"topic\": string, \"duration\": string (e.g. '45m', '1h'), \"type\": \"learn\" | \"practice\" | \"review\", \"completed\": boolean (always false) }]. Do NOT wrap the JSON in markdown formatting (like ```json), just output the raw JSON array."
        });

        const { previousTopics } = await req.json();

        const prompt = previousTopics && previousTopics.length > 0
            ? `The student has previously studied these topics: ${previousTopics.join(', ')}. Please generate exactly 3 NEW, logical next-step Computer Science tasks for their daily study plan. Make them specific and actionable.`
            : `Please generate exactly 3 foundational Computer Science tasks (e.g. basic DSA, Databases) to start a new student's daily study plan. Make them specific and actionable.`;

        const result = await model.generateContent(prompt);
        let rawText = result.response.text();

        // Cleanup any accidental markdown from Gemini
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        const newTasks = JSON.parse(rawText);

        return NextResponse.json({ tasks: newTasks });
    } catch (error: any) {
        console.error('Study Plan AI Error:', error);
        return NextResponse.json({ error: 'Failed to generate study plan' }, { status: 500 });
    }
}
