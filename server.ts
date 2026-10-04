/**
 * Full-stack Express server for Lumen
 * Serves Vite in development and provides server-side Gemini API endpoints.
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

const app = express();

// Support large base64 receipt uploads
app.use(express.json({ limit: '25mb' }));

// Server-side Gemini AI Client with user-agent telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: AI Receipt Scanner & Category Classifier
app.post('/api/analyze-receipt', async (req, res) => {
  try {
    const { 
      imageBase64, 
      mimeType = 'image/jpeg', 
      voiceInstructions = '', 
      audioBase64 = '',
      audioMimeType = 'audio/webm',
      meName = 'Kiran', 
      friendName = 'Alex' 
    } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 data in request body' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key is not configured on the server. Please check the Secrets panel.' 
      });
    }

    // Strip data URL header if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const promptText = `You are an expert financial auditor for Lumen Expense Tracker.
Analyze this receipt image (and any accompanying voice recording or spoken description) with high precision.
Extract:
1. The merchant or vendor name (e.g. Trader Joe's, Target, Uber, Starbucks).
2. The exact transaction date in YYYY-MM-DD format (if visible).
3. The total amount, tax, and tip.
4. Each itemized line item with its individual price.
5. Classify every item into one of the following exact categories:
   - "uber" (Uber, Lyft, taxi, train tickets, public transit)
   - "dining" (Restaurants, food delivery, takeout meals, cafeteria food)
   - "groceries" (Pantry food, vegetables, fruit, supermarket items, dairy)
   - "coffee" (Specialty coffee, lattes, tea, bakery cafe snacks)
   - "shopping" (Household goods, electronics, toiletries, clothes, supplies)
   - "housing" (Rent, utilities, home appliances, hardware)
   - "subscriptions" (Software, streaming, recurring digital charges)
   - "entertainment" (Movies, concerts, events, games, recreational outings)
   - "other" (Anything else)

6. For each item, provide a clear, user-friendly 1-sentence rationale ("categoryReasoning") describing which category it was assigned to and why, so users can verify.

${voiceInstructions || audioBase64 ? `
IMPORTANT - USER SPOKEN VOICE DESCRIPTION PROVIDED:
${voiceInstructions ? `Spoken Transcript: "${voiceInstructions}"` : ''}
${audioBase64 ? 'An audio recording of the user describing this receipt is attached in the request.' : ''}

The user recorded this spoken description specifically for this receipt photo. You MUST carefully evaluate and apply their instructions:
- Roommate names: User is "${meName}" ('me'), roommate/friend is "${friendName}" ('friend').
- If the user stated who paid (e.g., "${friendName} paid", "I paid", "paid with my card", "Alex covered it"), set 'paidBy' to 'me' or 'friend'.
- If the user stated which items are shared vs solo (e.g., "split everything except the beer", "milk and eggs are 50/50, charger is mine", "salad was for ${friendName}"), set 'split' to 'equal' or 'none', and assign the designated 'paidBy' and ownership.
- If the user specified a custom category or clarified what an ambiguous receipt code means, adopt it.
- Summarize how the voice description was interpreted in 'voiceSummary', and describe the effect on each item in 'voiceContextApplied'.
` : `By default, set 'paidBy' to 'me' and 'split' to 'equal' unless the item is clearly personal.`}`;

    const contentParts: any[] = [
      {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      },
    ];

    if (audioBase64) {
      const cleanAudioBase64 = audioBase64.replace(/^data:audio\/[a-zA-Z0-9+.-]+;base64,/, '');
      contentParts.push({
        inlineData: {
          mimeType: audioMimeType || 'audio/webm',
          data: cleanAudioBase64,
        },
      });
    }

    contentParts.push({
      text: promptText,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: contentParts,
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: {
              type: Type.STRING,
              description: 'The store or merchant name',
            },
            date: {
              type: Type.STRING,
              description: 'Transaction date in YYYY-MM-DD format, or empty if illegible',
            },
            total: {
              type: Type.NUMBER,
              description: 'Grand total charged on receipt',
            },
            tax: {
              type: Type.NUMBER,
              description: 'Taxes charged if visible, else 0',
            },
            tip: {
              type: Type.NUMBER,
              description: 'Tip charged if visible, else 0',
            },
            currency: {
              type: Type.STRING,
              description: 'Currency symbol ($)',
            },
            summary: {
              type: Type.STRING,
              description: 'A brief 1-2 sentence overview of the receipt',
            },
            voiceSummary: {
              type: Type.STRING,
              description: 'Summary of how the user voice description was applied, or empty if no voice provided',
            },
            items: {
              type: Type.ARRAY,
              description: 'Parsed line items from the receipt',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: 'Item name as printed or cleaned',
                  },
                  amount: {
                    type: Type.NUMBER,
                    description: 'Price of this line item',
                  },
                  category: {
                    type: Type.STRING,
                    description:
                      'One of: uber, dining, groceries, coffee, shopping, housing, subscriptions, entertainment, other',
                  },
                  categoryReasoning: {
                    type: Type.STRING,
                    description: 'Why this item was categorized into this specific category',
                  },
                  paidBy: {
                    type: Type.STRING,
                    description: "Either 'me' or 'friend' based on user voice instructions or default",
                  },
                  split: {
                    type: Type.STRING,
                    description: "Either 'equal' (50/50 split) or 'none' (solo/100%)",
                  },
                  voiceContextApplied: {
                    type: Type.STRING,
                    description: 'Notes on how spoken voice instruction affected this item (e.g. User said salad was solo for Alex)',
                  },
                },
                required: ['name', 'amount', 'category', 'categoryReasoning'],
              },
            },
          },
          required: ['merchant', 'total', 'items'],
        },
      },
    });

    const outputText = response.text;
    if (!outputText) {
      return res.status(502).json({ error: 'Empty response returned from Gemini API' });
    }

    const parsedJson = JSON.parse(outputText);
    return res.json({
      success: true,
      data: parsedJson,
    });
  } catch (err: any) {
    console.error('Error analyzing receipt with Gemini:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to analyze receipt. Please verify image clarity.',
    });
  }
});

// Mount Vite or static build
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.resolve(distPath, 'index.html'));

  if (!isProduction || !hasDist) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const portNum = Number(PORT) || 3000;
  app.listen(portNum, '0.0.0.0', () => {
    console.log(`Lumen Full-Stack Server running on http://0.0.0.0:${portNum}`);
  });
}

startServer();
