import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request) {
  try {
    const { message, history, problemDescription } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY environment configuration.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are a helpful, professional technical interviewer. The candidate is practicing a coding problem: "${problemDescription}". Respond to their messages, guide them if they are stuck without giving away the direct answer completely, and maintain a realistic interview tone. Keep answers clear, short, and conversational.`;

    const formattedContents = history.map(m => ({
      role: m.sender === 'Candidate' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    formattedContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.6,
      }
    });

    return NextResponse.json({ reply: response.text.trim() });
  } catch (error) {
    console.error("🔴 Chat endpoint failure:", error);
    return NextResponse.json({ error: error.message || 'AI processing error' }, { status: 500 });
  }
}