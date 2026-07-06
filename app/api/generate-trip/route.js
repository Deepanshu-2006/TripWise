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

const fallbackItinerary = {
  destinationName: "Rome, Italy (Demo Mode)",
  tagline: "Eternal City Highlights & Hidden Culinary Gems",
  estimatedCost: "$1,450",
  coordinates: { lat: 41.9028, lng: 12.4964 },
  days: [
    {
      dayNumber: 1,
      dateLabel: "Day 1 - Ancient Wonders & Colosseum",
      activities: [
        {
          time: "09:00 AM",
          category: "Sightseeing",
          title: "Colosseum VIP Fast-Track Exploration",
          description: "Step into the iconic amphitheater with skip-the-line access before peak midday crowds arrive.",
          badge: "MUST SEE",
          coordinates: { lat: 41.8902, lng: 12.4922 }
        },
        {
          time: "01:00 PM",
          category: "Dining",
          title: "Authentic Roman Pasta at Osteria da Fortunata",
          description: "Watch pasta chefs hand-roll fresh strozzapreti while savoring classic carbonara and cacio e pepe.",
          badge: "LOCAL GEM",
          coordinates: { lat: 41.8958, lng: 12.4732 }
        },
        {
          time: "04:30 PM",
          category: "Culture",
          title: "Pantheon Interior & Piazza Navona Sunset",
          description: "Marvel at the ancient dome's oculus in late afternoon light, followed by artisanal gelato near Bernini's fountains.",
          badge: "OPTIMIZED ROUTE",
          coordinates: { lat: 41.8986, lng: 12.4769 }
        }
      ]
    },
    {
      dayNumber: 2,
      dateLabel: "Day 2 - Vatican Treasures & Trastevere Vibe",
      activities: [
        {
          time: "08:30 AM",
          category: "Sightseeing",
          title: "Vatican Museums & Sistine Chapel Early Entry",
          description: "Experience Michelangelo's masterpiece in tranquility before general admission doors open.",
          badge: "OPTIMIZED ROUTE",
          coordinates: { lat: 41.9067, lng: 12.4536 }
        },
        {
          time: "01:30 PM",
          category: "Dining",
          title: "Market Lunch at Mercato di Testaccio",
          description: "Feast on gourmet Roman street food, from tender panino con bollito to artisanal Sicilian cannoli.",
          badge: "BUDGET MATCH",
          coordinates: { lat: 41.8785, lng: 12.4746 }
        },
        {
          time: "06:00 PM",
          category: "Leisure",
          title: "Sunset Aperitivo in Trastevere Alleyways",
          description: "Wander ivy-draped cobblestone streets and enjoy Aperol spritzes accompanied by complimentary local tapas.",
          badge: "LOCAL GEM",
          coordinates: { lat: 41.8894, lng: 12.4691 }
        }
      ]
    },
    {
      dayNumber: 3,
      dateLabel: "Day 3 - Baroque Masterpieces & Panoramic Views",
      activities: [
        {
          time: "09:30 AM",
          category: "Sightseeing",
          title: "Trevi Fountain & Spanish Steps Morning Stroll",
          description: "Toss a coin into the sparkling fountain early in the day, then climb the famous travertine steps.",
          badge: "MUST SEE",
          coordinates: { lat: 41.9009, lng: 12.4833 }
        },
        {
          time: "01:00 PM",
          category: "Dining",
          title: "Rooftop Dining at Terrazza Borromini",
          description: "Enjoy gourmet Italian gastronomy with breathtaking 360-degree panoramic views overlooking Piazza Navona.",
          badge: "LOCAL GEM",
          coordinates: { lat: 41.8989, lng: 12.4731 }
        },
        {
          time: "05:00 PM",
          category: "Leisure",
          title: "Villa Borghese Gardens & Sunset at Pincio Terrace",
          description: "Relax in Rome's most beloved park and watch the sun dip below the St. Peter's Basilica skyline.",
          badge: "OPTIMIZED ROUTE",
          coordinates: { lat: 41.9114, lng: 12.4797 }
        }
      ]
    }
  ]
};

export async function POST(req) {
  try {
    const { prompt, interests = [], budget = 'standard', pace = 'balanced' } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not set. Using fallback itinerary.');
      return NextResponse.json({ success: true, itinerary: fallbackItinerary, isFallback: true });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are TripWise AI, an elite travel routing engine.
Create a high-impact, beautifully tailored travel itinerary based on the user's prompt.
User Prompt: "${prompt}"
Selected Vibe/Interests: ${interests.join(', ') || 'General highlights'}
Budget Level: ${budget}
Travel Pace: ${pace}

CRITICAL RULES FOR SPEED & QUALITY:
1. Generate exactly 3 to 4 days of itinerary (unless a specific duration is requested in the prompt).
2. For each day, provide exactly 3 activities across morning, afternoon, and evening/dining.
3. Keep activity descriptions punchy, vivid, and concise (1 to 2 sentences max) to ensure ultra-fast JSON generation latency.
4. Provide realistic GPS coordinates (lat, lng) for the destination center and every activity.
5. Include custom badges like "MUST SEE", "LOCAL GEM", "OPTIMIZED ROUTE", or "BUDGET MATCH".`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    let response = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: itinerarySchema,
            temperature: 0.6,
            maxOutputTokens: 3000,
          },
        });
        if (response && response.text) {
          break;
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed:`, err.message || err);
        lastError = err;
      }
    }

    if (!response || !response.text) {
      console.warn('All Gemini models failed (likely quota/rate limit). Returning fallback demo itinerary.', lastError);
      return NextResponse.json({ success: true, itinerary: fallbackItinerary, isFallback: true });
    }

    const itinerary = JSON.parse(response.text);
    return NextResponse.json({ success: true, itinerary });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ success: true, itinerary: fallbackItinerary, isFallback: true });
  }
}
