import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = await request.json();

    if (!audioBase64) {
      return NextResponse.json({ error: 'Missing audio data' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Gemini API key not configured'
      }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Robustly strip data URL prefix regardless of codec parameters (e.g. data:audio/webm;codecs=opus;base64,)
    const cleanBase64 = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
    const cleanMimeType = (mimeType || 'audio/webm').split(';')[0];

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        config: {
          systemInstruction: 'You are an accurate automatic speech recognition (ASR) engine. Transcribe the audio verbatim. Output ONLY the exact transcribed words spoken in the audio. Do not repeat instructions, do not add commentary, quotes, or markdown.'
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: cleanMimeType || 'audio/webm'
                }
              },
              {
                text: 'Transcribe the audio speech verbatim.'
              }
            ]
          }
        ]
      });
    } catch (modelErr) {
      console.warn('[Transcribe API] Fallback to gemini-3.5-flash:', modelErr.message);
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: cleanMimeType || 'audio/webm'
                }
              },
              {
                text: 'Transcribe the audio speech verbatim.'
              }
            ]
          }
        ]
      });
    }

    let transcript = response.text?.trim() || '';

    // Strip common ASR prefix headers if returned by model
    transcript = transcript
      .replace(/^(transcribed? text|transcription|transcript|spoken words?|spoken audio|asr output|text):\s*/i, '')
      .replace(/^["']|["']$/g, '')
      .trim();

    if (transcript.toLowerCase() === 'transcribe the audio speech verbatim.') {
      transcript = '';
    }

    return NextResponse.json({
      success: true,
      transcript
    });
  } catch (error) {
    console.error('Audio transcription error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to transcribe audio'
    }, { status: 500 });
  }
}
