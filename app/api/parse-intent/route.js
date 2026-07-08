import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const intentSchema = {
  type: 'OBJECT',
  properties: {
    destination: { type: 'STRING' },
    duration_days: { type: 'INTEGER' },
    budget_tier: { type: 'STRING' },
    vibes: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    },
    pace: { type: 'STRING' }
  },
  required: ['destination', 'duration_days', 'budget_tier', 'vibes', 'pace']
};

// Robust deterministic fallback engine strictly following inference rules
function deterministicParseIntent(text = "") {
  const lower = text.toLowerCase();

  // 1. Destination
  let destination = "Rome, Italy";
  if (lower.includes("london")) destination = "London, United Kingdom";
  else if (lower.includes("kyoto")) destination = "Kyoto, Japan";
  else if (lower.includes("tokyo")) destination = "Tokyo, Japan";
  else if (lower.includes("punjab")) destination = "Punjab, India";
  else if (lower.includes("rome")) destination = "Rome, Italy";
  else if (lower.includes("paris")) destination = "Paris, France";
  else if (lower.includes("swiss") || lower.includes("alps") || lower.includes("switzerland")) destination = "Swiss Alps, Switzerland";
  else if (lower.includes("new york") || lower.includes("nyc")) destination = "New York, USA";
  else if (lower.includes("barcelona")) destination = "Barcelona, Spain";
  else {
    // Try regex like "in <city>" or "to <city>"
    const cityMatch = text.match(/(?:in|to|visit|exploring|for)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:during|for|with|luxury|budget|fast|relaxed|trip|vacation|where|$|,|\.))/i);
    if (cityMatch && cityMatch[1].trim().length > 2) {
      destination = cityMatch[1].trim();
    } else if (text.trim().length > 2 && text.trim().split(/\s+/).length <= 4) {
      // If prompt is just "punjab" or "Trip to Punjab"
      const clean = text.trim().replace(/^(?:generate\s+)?(?:a\s+)?(?:trip\s+to\s+|trip\s+for\s+|visit\s+|for\s+)/i, "").trim();
      if (clean.length > 2) {
        destination = clean.charAt(0).toUpperCase() + clean.slice(1);
      }
    }
  }

  // 2. Duration days (default to 3)
  let duration_days = 3;
  const daysMatch = lower.match(/(\d+)\s*(?:days?|nights?)/);
  if (daysMatch) {
    duration_days = parseInt(daysMatch[1], 10);
  } else {
    const weeksMatch = lower.match(/(\d+)\s*(?:weeks?|wks?)/);
    if (weeksMatch) {
      duration_days = parseInt(weeksMatch[1], 10) * 7;
    } else if (lower.includes("week")) {
      duration_days = 7;
    } else if (lower.includes("weekend")) {
      duration_days = 3;
    }
  }

  // 3. Budget tier
  let budget_tier = "Standard";
  if (/luxury|5-star|five-star|five star|fine dining|premium|first class|vip|high-end/i.test(lower)) {
    budget_tier = "Premium";
  } else if (/backpacking|hostel|cheap|economy|budget|low cost|saving|thrifty/i.test(lower)) {
    budget_tier = "Economy";
  }

  // 4. Vibes array: ["Foodie", "History", "Nature", "Shopping", "Art", "Nightlife", "Family"]
  const vibes = [];
  if (/foody|foodie|food|restaurants?|michelin|dining|eat|culinary|tasting|ramen|pasta|pizza|sushi|street food/i.test(lower)) {
    vibes.push("Foodie");
  }
  if (/historical|history|ancient|museums?|temples?|castles?|monuments?|ruins?|cathedrals?|palaces?|landmarks?|places?/i.test(lower)) {
    // Note: if "historical places" or "ancient" matches
    if (/historical|history|ancient|museums?|temples?|castles?|monuments?|ruins?|cathedrals?|palaces?|landmarks?/i.test(lower)) {
      if (!vibes.includes("History")) vibes.push("History");
    }
  }
  if (/nature|scenic|gardens?|parks?|hiking|mountains?|lakes?|beaches?|blossom|forests?|outdoors?|bamboo/i.test(lower)) {
    vibes.push("Nature");
  }
  if (/shopping|shops?|boutiques?|markets?|malls?|stores?|fashion|souvenirs?/i.test(lower)) {
    vibes.push("Shopping");
  }
  if (/art|galleries?|gallery|exhibitions?|painting|sculpture|contemporary|design|teamlab/i.test(lower)) {
    vibes.push("Art");
  }
  if (/nightlife|night|bars?|clubs?|pubs?|izakaya|party|cocktails?|cyberpunk|drinks?/i.test(lower)) {
    vibes.push("Nightlife");
  }
  if (/kids?|family|children|child|toddlers?|parents?|kid-friendly/i.test(lower)) {
    vibes.push("Family");
  }

  if (vibes.length === 0) {
    vibes.push("Foodie", "History");
  }

  // 5. Pace: "Relaxed" | "Balanced" | "Fast-paced"
  let pace = "Balanced";
  if (/relaxed|slow|chill|easygoing|leisurely|calm|peaceful/i.test(lower)) {
    pace = "Relaxed";
  } else if (/fast-paced|fast|packed|busy|intense|whirlwind|nonstop|cyberpunk/i.test(lower)) {
    pace = "Fast-paced";
  }

  return {
    destination,
    duration_days,
    budget_tier,
    vibes,
    pace
  };
}

function normalizeIntent(intent) {
  if (!intent) return intent;
  let dest = intent.destination || "";
  const lower = dest.toLowerCase();
  if (lower === "london" || lower.includes("london")) dest = "London, United Kingdom";
  else if (lower === "rome" || lower.includes("rome")) dest = "Rome, Italy";
  else if (lower === "kyoto" || lower.includes("kyoto")) dest = "Kyoto, Japan";
  else if (lower === "tokyo" || lower.includes("tokyo")) dest = "Tokyo, Japan";
  else if (lower === "paris" || lower.includes("paris")) dest = "Paris, France";
  else if (lower.includes("punjab")) dest = "Punjab, India";
  else if (lower.includes("swiss") || lower.includes("alps")) dest = "Swiss Alps, Switzerland";
  else if (lower.includes("new york") || lower === "nyc") dest = "New York, USA";
  else if (lower.includes("barcelona")) dest = "Barcelona, Spain";
  
  return {
    ...intent,
    destination: dest
  };
}

export async function POST(req) {
  try {
    const { prompt = "" } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not set in parse-intent. Using deterministic parser.');
      const parsed = normalizeIntent(deterministicParseIntent(prompt));
      return NextResponse.json({ success: true, intent: parsed, isFallback: true });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are the core intent-parsing engine for TripWise, an advanced AI travel planner. 

Your task is to analyze a raw user travel query and extract key itinerary parameters. You must output a clean, strict JSON object and absolutely nothing else. Do not include markdown formatting, markdown code blocks (like \`\`\`json), or conversational prose.

Extract the following fields from the user input:
1. "destination": The target city/country. (If ambiguous, infer the most logical prominent city).
2. "duration_days": An integer representing the trip length. (Default to 3 if unspecified).
3. "budget_tier": Must strictly be one of: "Economy", "Standard", or "Premium".
4. "vibes": An array of strings representing the trip style. Choose from: ["Foodie", "History", "Nature", "Shopping", "Art", "Nightlife", "Family"].
5. "pace": Must strictly be one of: "Relaxed", "Balanced", or "Fast-paced".

### Rules for Inference:
- "luxury", "5-star", "fine dining" -> budget_tier: "Premium"
- "backpacking", "hostel", "cheap" -> budget_tier: "Economy"
- "foody", "restaurants", "michelin" -> vibes includes "Foodie"
- "historical", "ancient", "museums" -> vibes includes "History"
- "kids", "family" -> vibes includes "Family"

Analyze the following user input and return the JSON object:
${prompt}`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    let response = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: intentSchema,
            temperature: 0.1,
            maxOutputTokens: 1000,
          },
        });
        if (response && response.text) {
          break;
        }
      } catch (err) {
        console.warn(`parse-intent model ${modelName} failed:`, err.message || err);
      }
    }

    if (!response || !response.text) {
      console.warn('All Gemini models failed in parse-intent. Returning deterministic parsed intent.');
      const parsed = normalizeIntent(deterministicParseIntent(prompt));
      return NextResponse.json({ success: true, intent: parsed, isFallback: true });
    }

    const intent = normalizeIntent(JSON.parse(response.text));
    return NextResponse.json({ success: true, intent });
  } catch (error) {
    console.error('Error in parse-intent API route:', error);
    let bodyPrompt = "";
    try { bodyPrompt = (await req.json())?.prompt || ""; } catch(e) {}
    const parsed = normalizeIntent(deterministicParseIntent(bodyPrompt));
    return NextResponse.json({ success: true, intent: parsed, isFallback: true });
  }
}
