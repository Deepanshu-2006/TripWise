import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Missing imageBase64' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        fallback: true,
        message: 'No API Key configured, falling back to client OCR'
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const modelsToTry = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    let response = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: 'image/jpeg'
                  }
                },
                {
                  text: `Analyze this receipt photo image carefully and extract:
1. Exact total amount paid (numeric value only, e.g. 41.29). Look for Total, Amount Due, or Grand Total.
2. Merchant / Restaurant / Store name (e.g. Fish & Chips Fast Foods).
3. Currency code (USD, EUR, GBP, JPY, CAD, AUD, INR, CHF). Default to EUR if Euro symbol (€) is found.
4. Category (one of: Food & Dining, Transport, Shopping, Activities, Lodging, Other).

Return JSON only in this exact schema:
{
  "merchant": "Merchant Name",
  "amount": "41.29",
  "currency": "EUR",
  "category": "Food & Dining",
  "confidence": 95
}`
                }
              ]
            }
          ],
          config: {
            responseMimeType: 'application/json'
          }
        });
        if (response && response.text) {
          break;
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed for OCR:`, err.message || err);
        lastError = err;
      }
    }

    if (!response || !response.text) {
      throw new Error(`All Gemini models failed for OCR: ${lastError?.message || 'Unknown error'}`);
    }

    let text = response.text;
    if (typeof text === 'function') text = text(); // handle old and new SDKs just in case
    
    // Extract JSON block using regex to avoid parsing errors from trailing/leading text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    const parsed = JSON.parse(text);

    return NextResponse.json({
      success: true,
      data: {
        merchant: parsed.merchant || '',
        amount: parsed.amount ? parseFloat(parsed.amount).toString() : '',
        currency: parsed.currency || 'EUR',
        category: parsed.category || 'Food & Dining',
        confidence: parsed.confidence || 90,
        isConfident: true
      }
    });

  } catch (error) {
    console.error('OCR Receipt API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}
