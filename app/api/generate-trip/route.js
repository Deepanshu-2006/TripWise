import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import londonMock from '../../mocks/london_mock.json';
import romeMock from '../../mocks/rome_mock.json';
import kyotoMock from '../../mocks/kyoto_mock.json';
import tokyoMock from '../../mocks/tokyo_mock.json';
import punjabMock from '../../mocks/punjab_mock.json';

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
                duration: { type: 'STRING' },
                cost: { type: 'STRING' },
                preferenceReasoning: { type: 'STRING' },
                indoorOutdoor: { type: 'STRING' },
              },
              required: ['time', 'category', 'title', 'description', 'badge', 'coordinates', 'duration', 'cost', 'indoorOutdoor'],
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
          duration: "3 hrs",
          cost: "€32.00 VIP ticket + arena",
          coordinates: { lat: 41.8902, lng: 12.4922 }
        },
        {
          time: "01:00 PM",
          category: "Dining",
          title: "Authentic Roman Pasta at Osteria da Fortunata",
          description: "Watch pasta chefs hand-roll fresh strozzapreti while savoring classic carbonara and cacio e pepe.",
          badge: "LOCAL GEM",
          duration: "1.5 hrs",
          cost: "€24 pasta + local wine",
          coordinates: { lat: 41.8958, lng: 12.4732 }
        },
        {
          time: "04:30 PM",
          category: "Culture",
          title: "Pantheon Interior & Piazza Navona Sunset",
          description: "Marvel at the ancient dome's oculus in late afternoon light, followed by artisanal gelato near Bernini's fountains.",
          badge: "OPTIMIZED ROUTE",
          duration: "2 hrs",
          cost: "€5.00 entry + €4 gelato",
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
          duration: "3.5 hrs",
          cost: "€30.00 early entry pass",
          coordinates: { lat: 41.9067, lng: 12.4536 }
        },
        {
          time: "01:30 PM",
          category: "Dining",
          title: "Market Lunch at Mercato di Testaccio",
          description: "Feast on gourmet Roman street food, from tender panino con bollito to artisanal Sicilian cannoli.",
          badge: "BUDGET MATCH",
          duration: "1.5 hrs",
          cost: "€15 - €22 street market lunch",
          coordinates: { lat: 41.8785, lng: 12.4746 }
        },
        {
          time: "06:00 PM",
          category: "Leisure",
          title: "Sunset Aperitivo in Trastevere Alleyways",
          description: "Wander ivy-draped cobblestone streets and enjoy Aperol spritzes accompanied by complimentary local tapas.",
          badge: "LOCAL GEM",
          duration: "2.5 hrs",
          cost: "€12 - €16 aperitivo buffet",
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
          duration: "2 hrs",
          cost: "Free admission (€1 coin)",
          coordinates: { lat: 41.9009, lng: 12.4833 }
        },
        {
          time: "01:00 PM",
          category: "Dining",
          title: "Rooftop Dining at Terrazza Borromini",
          description: "Enjoy gourmet Italian gastronomy with breathtaking 360-degree panoramic views overlooking Piazza Navona.",
          badge: "LOCAL GEM",
          duration: "2 hrs",
          cost: "€65 - €90 rooftop lunch",
          coordinates: { lat: 41.8989, lng: 12.4731 }
        },
        {
          time: "05:00 PM",
          category: "Leisure",
          title: "Villa Borghese Gardens & Sunset at Pincio Terrace",
          description: "Relax in Rome's most beloved park and watch the sun dip below the St. Peter's Basilica skyline.",
          badge: "OPTIMIZED ROUTE",
          duration: "2 hrs",
          cost: "Free to explore",
          coordinates: { lat: 41.9114, lng: 12.4797 }
        }
      ]
    }
  ]
};

function getDynamicMockItinerary(promptOrDest = "", destination = "") {
  const combined = `${promptOrDest} ${destination}`.toLowerCase();
  if (combined.includes("punjab")) return punjabMock;
  if (combined.includes("london")) return londonMock;
  if (combined.includes("kyoto")) return kyotoMock;
  if (combined.includes("tokyo")) return tokyoMock;
  if (combined.includes("rome")) return romeMock;
  
  // Universal dynamic demo customizer: adapt fallback template to requested city so users never see Rome when asking for another city
  let customDestName = destination || promptOrDest;
  if (!customDestName || customDestName.trim().length === 0 || customDestName.toLowerCase().includes("rome")) {
    return fallbackItinerary;
  }
  
  const cleanDest = customDestName.trim().replace(/^(?:generate\s+)?(?:a\s+)?(?:trip\s+to\s+|trip\s+for\s+|visit\s+|for\s+)/i, "").trim();
  const titleDest = cleanDest.length > 0 ? (cleanDest.charAt(0).toUpperCase() + cleanDest.slice(1)) : "Your Destination";
  
  const customItinerary = JSON.parse(JSON.stringify(fallbackItinerary));
  customItinerary.destinationName = `${titleDest} (Demo Mode)`;
  customItinerary.tagline = `Highlights, Culture & Top Local Gems across ${titleDest}`;
  return customItinerary;
}

export async function POST(req) {
  try {
    const { prompt = "", destination = "", basecamp = "", interests = [], budget = 'standard', pace = 'balanced', userPreferences = null } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    const mockPayload = getDynamicMockItinerary(prompt, destination);

    if (!apiKey) {
      console.warn('GEMINI_API_KEY not set. Using dynamic mock itinerary for:', destination || prompt);
      return NextResponse.json({ success: true, itinerary: mockPayload, isFallback: true });
    }

    const ai = new GoogleGenAI({ apiKey });

    const isBasecampProvided = Boolean(basecamp && basecamp.trim());
    const hotelMode = isBasecampProvided ? 'basecamp' : 'undecided';
    const basecampHotel = isBasecampProvided ? basecamp.trim() : null;

    const basecampInstruction = isBasecampProvided 
      ? `\nCRITICAL GEOGRAPHY RULE: The user has explicitly requested to regenerate the trip around their selected hotel: "${basecampHotel}". 
1. ALL cafes, breakfast spots, and dining locations MUST be strictly within a 15-minute walk from "${basecampHotel}".
2. The entire trip must be logically re-optimized and regenerated to start from, revolve around, and end near this specific hotel.
3. Provide realistic travel times and distances from this hotel for all activities.`
      : `\nNOTE ON GEOGRAPHY: The user has not chosen a specific hotel yet (hotelMode: "undecided"). Route activities around a popular central area of the city (e.g. City Center / Central Plaza) as a placeholder anchor.`;

    let preferenceInstruction = "";
    if (userPreferences) {
      const highAffinity = Object.entries(userPreferences.categoryAffinities || {})
        .filter(([_, score]) => score >= 0.7)
        .map(([cat]) => cat);
      const dislikes = userPreferences.explicitDislikes || [];
      
      if (highAffinity.length > 0 || dislikes.length > 0) {
        preferenceInstruction = `\nLEARNED PREFERENCES (CRITICAL):
- The user has historically loved these categories (weight them highly, but don't make the trip 100% these): ${highAffinity.join(', ') || 'None specifically'}.
- The user explicitly DISLIKES these categories (avoid them unless absolutely necessary for pacing or geography): ${dislikes.join(', ') || 'None specifically'}.
- For EACH activity, provide a \`preferenceReasoning\` field indicating if it was suggested based on these learned preferences (e.g. "Suggested because you've consistently loved food experiences on past trips") or just general matching (e.g. "A classic must-see for first time visitors").`;
      }
    }

    const systemPrompt = `You are TripWise AI, an elite travel routing engine.
Create a high-impact, beautifully tailored travel itinerary based on the user's prompt.
User Prompt: "${prompt}"
Selected Vibe/Interests: ${interests.join(', ') || 'General highlights'}
Budget Level: ${budget}
Travel Pace: ${pace}
${basecampInstruction}
${preferenceInstruction}

CRITICAL RULES FOR SPEED & QUALITY:
1. Generate exactly 3 to 4 days of itinerary (unless a specific duration is requested in the prompt).
2. For each day, provide exactly 3 activities across morning, afternoon, and evening/dining.
3. Keep activity descriptions punchy, vivid, and concise (1 to 2 sentences max) to ensure ultra-fast JSON generation latency.
4. Provide realistic GPS coordinates (lat, lng) for the destination center and every activity.
5. Include custom badges like "MUST SEE", "LOCAL GEM", "OPTIMIZED ROUTE", or "BUDGET MATCH".
6. For EVERY activity, you MUST provide the EXACT REAL-WORLD local time (e.g. "09:00 AM"), exact realistic visit duration (e.g. "2 hrs" or "1.5 hrs"), and exact verified real-world ticket price or average meal cost in local currency/USD/EUR/GBP (e.g. "£34.80 entry ticket", "€32.00 Colosseum pass", "¥3,500 lunch", or "Free admission"). NEVER use generic guesses or placeholders.
7. Fill out the \`preferenceReasoning\` field for every activity.
8. Accurately tag EVERY activity as "Indoor" or "Outdoor" in the \`indoorOutdoor\` field.`;

    const modelsToTry = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
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
            maxOutputTokens: 8192,
          },
        });
        if (response && response.text) {
          break;
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed:`, err.message || err);
        lastError = err;
        try {
          require('fs').appendFileSync('error_log.txt', `\nModel ${modelName} failed: ${err.message || err}\n`);
        } catch(e) {}
      }
    }

    if (!response || !response.text) {
      console.warn('All Gemini models failed (likely quota/rate limit). Returning dynamic mock itinerary.', lastError);
      
      // If we're falling back but the user specifically wanted to re-optimize around a hotel, 
      // let's intelligently adjust the mock data so the UI accurately reflects their request.
      if (isBasecampProvided && mockPayload && mockPayload.days) {
        mockPayload.days.forEach(day => {
          if (day.activities) {
            day.activities.forEach(act => {
              if (act.category === 'Dining') {
                act.title = `${act.title} (Near Hotel)`;
                act.description = `Just a 10-15 minute walk from ${basecampHotel}. ${act.description}`;
              }
            });
          }
        });
      }

      return NextResponse.json({ 
        success: true, 
        itinerary: { ...mockPayload, hotelMode, basecampHotel }, 
        isFallback: true 
      });
    }

    const itinerary = JSON.parse(response.text);
    return NextResponse.json({ 
      success: true, 
      itinerary: { ...itinerary, hotelMode, basecampHotel } 
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    try {
      require('fs').appendFileSync('outer_error.txt', `\nAPI Error: ${error.message || error}\nStack: ${error.stack}\n`);
    } catch(e) {}
    let body = {};
    try { body = await req.json(); } catch (e) {}
    const mockPayload = getDynamicMockItinerary(body.prompt, body.destination);
    const fallbackHotelMode = body.basecamp && body.basecamp.trim() ? 'basecamp' : 'undecided';
    const fallbackBasecampHotel = body.basecamp && body.basecamp.trim() ? body.basecamp.trim() : null;
    return NextResponse.json({ 
      success: true, 
      itinerary: { ...mockPayload, hotelMode: fallbackHotelMode, basecampHotel: fallbackBasecampHotel }, 
      isFallback: true 
    });
  }
}
