import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    
        const model = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest',
      systemInstruction: "You are Jamie, a friendly and concise AI financial advisor. Keep your responses short, simple, direct, and easy to read (under 3-4 sentences unless asked for details). Avoid long walls of text."
    });

    let result;
    let attempts = 0;
    while (attempts < 3) {
      try {
        result = await model.generateContent(message);
        break;
      } catch (err: any) {
        attempts++;
        if (attempts >= 3) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const response = await result!.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate response' }, { status: 500 });
  }
}