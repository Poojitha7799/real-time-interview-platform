import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import mysql from 'mysql2/promise';

export async function POST(request) {
  try {
    const { roomId, code, problemDescription, language, messages } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = "You are an expert technical interviewer. Analyze the candidate submission. Return raw JSON matching this schema: { \"score\": 85, \"efficiency\": \"text\", \"communication\": \"text\", \"feedback\": \"text\" }. Output only valid JSON. No markdown wrappers.";
    const conversationLog = messages.map(m => m.sender + ": " + m.text).join('\n');

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: "Problem: " + problemDescription + "\nLanguage: " + language + "\nFinal Code:\n" + code + "\n\nConversation Log:\n" + conversationLog,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      });
    } catch (apiErr) {
      if (apiErr.status === 503 || String(apiErr).includes('503')) {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: "Problem: " + problemDescription + "\nLanguage: " + language + "\nFinal Code:\n" + code + "\n\nConversation Log:\n" + conversationLog,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        });
      } else {
        throw apiErr;
      }
    }

    const parsedData = JSON.parse(response.text.trim());

    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'interview_platform'
      });

      const checkQuery = "SELECT id FROM interview_sessions WHERE id = ?";
      const [rows] = await connection.execute(checkQuery, [roomId]);

      if (rows.length === 0) {
        const createSessionQuery = "INSERT INTO interview_sessions (id, created_at) VALUES (?, NOW())";
        await connection.execute(createSessionQuery, [roomId]);
      }

      const query = "INSERT INTO interview_analytics (session_id, overall_score, code_efficiency, communication_rating, constructive_feedback, completed_at) VALUES (?, ?, ?, ?, ?, NOW())";
      await connection.execute(query, [
        roomId, 
        parsedData.score || 0, 
        parsedData.efficiency || 'No data', 
        parsedData.communication || 'No data', 
        parsedData.feedback || 'No data'
      ]);
      
      await connection.end();
      console.log("Session analytics entry saved successfully.");
    } catch (dbError) {
      console.error("Database connection bypass warning:", dbError);
    }

    const visibleReport = "Score: " + parsedData.score + "/100\n\nEfficiency:\n" + parsedData.efficiency + "\n\nCommunication:\n" + parsedData.communication + "\n\nFeedback:\n" + parsedData.feedback;
    return NextResponse.json({ evaluation: visibleReport });

  } catch (error) {
    console.error("Pipeline breakdown:", error);
    return NextResponse.json({ error: 'AI processing error' }, { status: 500 });
  }
}