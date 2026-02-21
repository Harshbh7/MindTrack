const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not found in .env.local file");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: "You are an AI Tutor for MindTrack. You help students with their studies, explain concepts, and solve coding doubts. Be encouraging and concise."
        });

        const chat = model.startChat({
            history: []
        });

        const result = await chat.sendMessage("Hello there!");
        console.log("SUCCESS:", result.response.text());
    } catch (err) {
        console.error("GEMINI ERROR TRACE:");
        console.error(err);
    }
}

testGemini();
