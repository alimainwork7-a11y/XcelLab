
import { GoogleGenAI, Type } from "@google/genai";
import { ColumnDefinition } from "../types";

const API_KEY = process.env.API_KEY || "";

export const generateCustomSchema = async (prompt: string): Promise<ColumnDefinition[]> => {
  if (!API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate an array of 5-8 column definitions for an Excel dataset about: "${prompt}". 
    Return a list of column names and their data types from this list: [string, number, date, currency, email, city].`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "The column header name" },
            type: { 
              type: Type.STRING, 
              description: "One of: string, number, date, currency, email, city" 
            }
          },
          required: ["name", "type"]
        }
      }
    }
  });

  try {
    const result = JSON.parse(response.text);
    return result as ColumnDefinition[];
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};
