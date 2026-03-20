import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow frontend to communicate with backend
app.use(express.json()); // Parse JSON request bodies

// Initialize Gemini Client with secure API Key from .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// The Debug Endpoint
app.post('/api/debug', async (req, res) => {
  try {
    const { buggyCode, language } = req.body;

    if (!buggyCode) {
      return res.status(400).json({ error: 'Missing buggyCode in request body' });
    }

    const languageContext = language ? `The code is written in ${language}.\n` : '';
    const prompt = `You are a senior developer with 10+ years of experience.
Your task is to debug the following code. Identify the bugs, fix them, and explain them in simple, everyday language that a junior developer can understand.

${languageContext}Code to debug:
${buggyCode}
`;

    // Make the request using the gemini-2.5-flash model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fixedCode: {
              type: Type.STRING,
              description: "The corrected code here, fully functioning",
            },
            explanation: {
              type: Type.STRING,
              description: "Step-by-step breakdown of the error and how to avoid it in the future, carefully formatted in beautiful markdown",
            },
          },
          required: ["fixedCode", "explanation"],
        },
        temperature: 0.1,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");

    const result = JSON.parse(text);

    // Send the result back to the frontend
    res.json(result);
  } catch (error) {
    console.error("AI API Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze code. Please try again." });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`DeFix backend running on http://localhost:${port}`);
});
