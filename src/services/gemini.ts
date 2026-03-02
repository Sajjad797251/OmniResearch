import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please configure it in the Secrets panel.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface ResearchStep {
  title: string;
  content: string;
}

export interface ResearchResult {
  summary: string;
  steps: ResearchStep[];
  furtherQuestions: string[];
}

export async function performDeepResearch(
  topic: string,
  image?: { data: string; mimeType: string }
): Promise<ResearchResult> {
  const ai = getAI();
  const model = "gemini-3.1-pro-preview";
  
  const parts: any[] = [{ text: `Conduct a deep, step-by-step research on the following topic: "${topic}". 
  If an image is provided, incorporate its details into the research.
  Provide a structured response with:
  1. A concise summary.
  2. A series of detailed research steps.
  3. Three thought-provoking further questions.` }];

  if (image) {
    parts.push({
      inlineData: {
        data: image.data,
        mimeType: image.mimeType,
      },
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
              },
              required: ["title", "content"],
            },
          },
          furtherQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["summary", "steps", "furtherQuestions"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response received from the model.");
  return JSON.parse(text);
}

export async function getQuickSummary(topic: string): Promise<string> {
  const ai = getAI();
  const model = "gemini-flash-lite-latest";
  const response = await ai.models.generateContent({
    model,
    contents: `Give a very brief, 1-sentence overview of what "${topic}" is.`,
  });
  return response.text || "";
}
