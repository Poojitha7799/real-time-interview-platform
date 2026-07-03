import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request) {
  try {
    const { problemDescription, messages } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key configuration parameters.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = "You are a professional technical interviewer conducting a coding assessment. Assess the candidate's responses, answer their questions naturally without explicitly giving away the full solution code, and keep them engaged in the context of their active problem.";
    const conversationLog = messages.map(m => m.sender + ": " + m.text).join('\n');

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: "Problem Context:\n" + problemDescription + "\n\nConversation Log:\n" + conversationLog,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7
        }
      });
    } catch (apiErr) {
      if (apiErr.status === 503 || String(apiErr).includes('503')) {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: "Problem Context:\n" + problemDescription + "\n\nConversation Log:\n" + conversationLog,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7
          }
        });
      } else {
        throw apiErr;
      }
    }

    return NextResponse.json({ reply: response.text });

  } catch (error) {
    console.error("Chat routing breakdown:", error);
    return NextResponse.json({ error: 'AI processing loop exception occurred.' }, { status: 500 });
  }
}