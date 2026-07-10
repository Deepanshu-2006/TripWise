import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { prompt, currentDay, destinationName = "Your Destination", dayIndex = 0 } = body;

    if (!currentDay || !currentDay.activities) {
      return NextResponse.json({ error: "No day itinerary provided to refine." }, { status: 400 });
    }

    // 1. Try real Gemini AI invocation if GEMINI_API_KEY is present
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "YOUR_API_KEY") {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `You are TripWise AI, an elite personal travel concierge and itinerary architect.
The user wants to refine Day ${currentDay.dayNumber || dayIndex + 1} (${currentDay.dateLabel || `Day ${dayIndex + 1}`}) of their trip to ${destinationName}.
Only modify this specific day's activities based on the user's instructions while preserving realistic travel flow, coordinates around the destination, duration, and cost format.

Current Day Activities:
${JSON.stringify(currentDay.activities, null, 2)}

User Modification Prompt: "${prompt}"

Return a valid JSON object matching this schema:
{
  "activities": [
    {
      "time": "e.g. 09:00 AM",
      "category": "e.g. Sightseeing | Dining | Culture | Leisure | Fine Dining",
      "title": "Stop Title",
      "description": "2-3 rich descriptive sentences explaining why this stop is great.",
      "badge": "e.g. MUST SEE | LOCAL GEM | GOURMET PICK | KID FRIENDLY | FAST-TRACK",
      "coordinates": { "lat": number, "lng": number },
      "duration": "e.g. 2 hrs",
      "cost": "e.g. €30 or Free"
    }
  ],
  "explanation": "A concise 1-sentence summary of the exact change made (e.g. Added a 3-course Michelin-star dinner at Pergola after Stop #3)."
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: systemInstruction,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          }
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);
        if (parsed && parsed.activities && Array.isArray(parsed.activities)) {
          const updatedDay = {
            ...currentDay,
            activities: parsed.activities
          };
          return NextResponse.json({
            updatedDay,
            explanation: parsed.explanation || `Refined Day ${dayIndex + 1} based on your AI instructions.`
          });
        }
      } catch (aiErr) {
        console.warn("Gemini API call for refine-day failed or rate limited, falling back to smart local refiner engine:", aiErr);
      }
    }

    // 2. Intelligent local fallbacks / demo refinement engine for instant response
    const activities = [...(currentDay.activities || [])];
    const pLower = (prompt || '').toLowerCase();
    const baseLat = activities[0]?.coordinates?.lat || 41.9028;
    const baseLng = activities[0]?.coordinates?.lng || 12.4964;
    let explanation = `Updated Day ${dayIndex + 1} schedule as requested.`;

    if (pLower.includes('michelin') || pLower.includes('dinner') || pLower.includes('after stop #3') || pLower.includes('after stop 3') || pLower.includes('food')) {
      const newStop = {
        time: "08:30 PM",
        category: "Fine Dining",
        title: "3-Course Michelin-Star Tasting Dinner & Rooftop Views",
        description: "Experience world-class culinary artistry with a 3-course seasonal tasting menu by renowned chefs, paired with rare regional wines and breathtaking night skyline views.",
        badge: "GOURMET PICK",
        duration: "2.5 hrs",
        cost: "€145 tasting menu + sommelier pairing",
        coordinates: { lat: baseLat + 0.0035, lng: baseLng + 0.0028 }
      };

      // Check if there are at least 3 stops to insert after Stop #3
      if (activities.length >= 3) {
        activities.splice(3, 0, newStop);
        explanation = `Added a 3-Course Michelin-Star Tasting Dinner directly after Stop #3!`;
      } else {
        activities.push(newStop);
        explanation = `Added a 3-Course Michelin-Star Tasting Dinner to close out Day ${dayIndex + 1}!`;
      }
    } else if (pLower.includes('kid') || pLower.includes('children') || pLower.includes('family')) {
      // Make existing activities more kid friendly and add an interactive stop
      activities.forEach((act, idx) => {
        if (act.category === 'Culture' || act.category === 'Sightseeing') {
          act.description += " Includes special interactive kids' discovery trail and skip-the-line family priority entrance.";
          act.badge = "KID FRIENDLY";
        }
      });
      const kidStop = {
        time: "03:30 PM",
        category: "Interactive",
        title: "Gladiator Training Academy & Artisanal Gelato Workshop",
        description: "An unforgettable hands-on experience where kids learn ancient Roman gladiator techniques with foam swords, followed by making custom gelato flavors with master gelatieri.",
        badge: "KID FRIENDLY GEM",
        duration: "2 hrs",
        cost: "€25 per child (includes gelato)",
        coordinates: { lat: baseLat - 0.0025, lng: baseLng + 0.004 }
      };
      activities.splice(Math.min(2, activities.length), 0, kidStop);
      explanation = `Redesigned Day ${dayIndex + 1} with kid-friendly priority access and added the Gladiator Academy & Gelato Workshop!`;
    } else if (pLower.includes('coffee') || pLower.includes('cafe') || pLower.includes('breakfast') || pLower.includes('pastry') || pLower.includes('morning')) {
      const coffeeStop = {
        time: "08:00 AM",
        category: "Dining",
        title: "Historic Artisanal Espresso Bar & Fresh Cornetti",
        description: "Start the day like a true local at a century-old espresso bar. Sip velvety cappuccino and sample warm cornetti filled with organic pistachio cream.",
        badge: "LOCAL GEM",
        duration: "45 mins",
        cost: "€6.50 espresso & pastries",
        coordinates: { lat: baseLat + 0.0018, lng: baseLng - 0.0022 }
      };
      activities.unshift(coffeeStop);
      explanation = `Added an early morning Artisanal Espresso & Pastry Stop before Stop #1!`;
    } else if (pLower.includes('relax') || pLower.includes('spa') || pLower.includes('break') || pLower.includes('chill')) {
      const spaStop = {
        time: "04:00 PM",
        category: "Leisure",
        title: "Luxury Thermal Spa & Afternoon Tea Break",
        description: "Unwind in ancient-inspired mineral thermal pools, steam rooms, and aromatherapy lounges, accompanied by organic herbal teas and light refreshments.",
        badge: "RELAXATION PICK",
        duration: "2 hrs",
        cost: "€55 day spa pass",
        coordinates: { lat: baseLat - 0.003, lng: baseLng - 0.0015 }
      };
      activities.splice(Math.min(activities.length, 2), 0, spaStop);
      explanation = `Inserted a rejuvenating Luxury Thermal Spa & Afternoon Tea break into Day ${dayIndex + 1}!`;
    } else {
      // General custom AI addition matching what they typed
      const customStop = {
        time: activities.length > 0 ? "05:00 PM" : "11:00 AM",
        category: "Custom Addition",
        title: (prompt || "Custom Activity").replace(/^add\s+(a\s+|an\s+)?/i, '').replace(/after\s+stop\s+#?\d+/i, '').trim() || "Custom AI Stop",
        description: `Tailored specifically for your request (${prompt}). Enjoy VIP access, curated guided insights, and seamless route timing.`,
        badge: "AI COPILOT ADDITION",
        duration: "1.5 hrs",
        cost: "€20 - €35 estimated",
        coordinates: { lat: baseLat + (Math.random() * 0.006 - 0.003), lng: baseLng + (Math.random() * 0.006 - 0.003) }
      };
      activities.push(customStop);
      explanation = `Added "${customStop.title}" to Day ${dayIndex + 1} as requested!`;
    }

    const updatedDay = {
      ...currentDay,
      activities
    };

    return NextResponse.json({
      updatedDay,
      explanation
    });

  } catch (error) {
    console.error("Error in /api/refine-day:", error);
    return NextResponse.json({ error: "Failed to refine day schedule." }, { status: 500 });
  }
}
