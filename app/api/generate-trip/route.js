import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const itinerarySchema = {
  type: 'OBJECT',
  properties: {
    destinationName: { type: 'STRING' },
    tagline: { type: 'STRING' },
    estimatedCost: { type: 'STRING' },
    coordinates: {
      type: 'OBJECT',
      properties: {
        lat: { type: 'NUMBER' },
        lng: { type: 'NUMBER' },
      },
      required: ['lat', 'lng'],
    },
    days: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          dayNumber: { type: 'INTEGER' },
          dateLabel: { type: 'STRING' },
          activities: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                time: { type: 'STRING' },
                category: { type: 'STRING' },
                title: { type: 'STRING' },
                description: { type: 'STRING' },
                badge: { type: 'STRING' },
                coordinates: {
                  type: 'OBJECT',
                  properties: {
                    lat: { type: 'NUMBER' },
                    lng: { type: 'NUMBER' },
                  },
                  required: ['lat', 'lng'],
                },
              },
              required: ['time', 'category', 'title', 'description', 'badge', 'coordinates'],
            },
          },
        },
        required: ['dayNumber', 'dateLabel', 'activities'],
      },
    },
  },
  required: ['destinationName', 'tagline', 'estimatedCost', 'coordinates', 'days'],
};

export async function POST(req) {
  try {
    const { prompt, interests = [], budget = 'standard', pace = 'balanced' } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY is not set in environment variables.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are TripWise AI, an expert travel planner.
Create a detailed, realistic, and highly tailored travel itinerary based on the user's request.
User Prompt: "${prompt}"
Selected Interests/Vibe: ${interests.join(', ') || 'General highlights'}
Budget Level: ${budget}
Travel Pace: ${pace}

Instructions:
1. Provide realistic approximate GPS coordinates (lat, lng) for the destination center and for every activity.
2. Generate 3 to 5 days of itinerary (or matching the duration requested in the prompt).
3. For each day, provide 3 to 4 activities across morning, afternoon, and evening/dining.
4. Include custom badges like "OPTIMIZED ROUTE", "LOCAL GEM", "BUDGET MATCH", or "MUST SEE".
5. Ensure all descriptions are engaging, practical, and tailored to the budget and vibe.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: itinerarySchema,
        temperature: 0.7,
      },
    });

    const itinerary = JSON.parse(response.text);
    return NextResponse.json({ success: true, itinerary });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate itinerary' },
      { status: 500 }
    );
  }
}
