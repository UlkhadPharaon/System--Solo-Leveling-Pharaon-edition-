import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Gemini AI Routine Advisor & Study Coach endpoint
  app.post('/api/ai-coach', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY environment variable is missing. Please set it in secrets.',
        });
      }

      const { prompt, context } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are a personalized elite productivity, academic, and creative AI mentor.
The user's core goals & schedule constraints:
1. Sleep: 6-8h every night.
2. Morning Routine: 45 min musculation workout every morning, 10 min speeching/public speaking practice, 30 min skincare, grooming & bath.
3. Priority Work ("Must Do Work"): 3-5 hours/day (studio work, dad's business, commitments to others).
4. Lunch: 12:00 PM eating break.
5. Post-Lunch Learning: 30min - 1h reading/podcasts/learning.
6. Key Weekly Targets:
   - Bangre Neo Lab: 15h - 20h / week
   - Movies / Cinema & Screenplay writing / content creation: 10h - 15h / week
   - School Lessons: 5h - 10h / week focused on SVT, Mathematics, Physics-Chemistry (PC), and History-Geography.

Provide concise, inspiring, practical advice, study schedules, screenplay critique, or schedule optimizations. Keep your tone encouraging, sharp, and structured.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemInstruction}\n\nCurrent User Progress Context: ${JSON.stringify(context || {})}\n\nUser Question/Request: ${prompt}` },
            ],
          },
        ],
      });

      const reply = response.text || 'No response generated.';
      return res.json({ reply });
    } catch (error: unknown) {
      console.error('Error in AI Coach API:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ error: errorMessage });
    }
  });

  // Vite middleware in development vs Static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
