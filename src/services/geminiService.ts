import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface DamageArea {
  label: string;
  severity: 'None' | 'Minor' | 'Severe';
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in normalized 0-1000 scale
  characteristics: string; // Detailed characteristics of the damage
  location: string;        // Specific location description within the structure
  confidenceScore: number; // Confidence score for this specific area (0-1)
}

export interface AISuggestion {
  type: 'mitigation' | 'safety' | 'expert' | 'warning';
  title: string;
  description: string;
}

export interface DamageAnalysis {
  damageLevel: 'None' | 'Minor' | 'Severe';
  confidence: number;
  description: string;
  detectedIssues: string[];
  recommendations: string[];
  aiSuggestions: AISuggestion[];
  spatialTelemetry?: DamageArea[];
}

export async function analyzeStructuralDamage(base64Image: string): Promise<DamageAnalysis> {
  const model = "gemini-3-flash-preview";

  const prompt = `
    As a structural engineer AI, analyze this image of a building after an earthquake.
    Provide a high-precision detailed assessment in JSON format.
    
    The response must be a JSON object with these keys:
    - damageLevel: "None", "Minor", or "Severe"
    - confidence: (global confidence number between 0 and 1)
    - description: (short technical summary)
    - detectedIssues: (array of strings)
    - recommendations: (array of strings)
    - aiSuggestions: (array of 3-4 objects)
      - type: "mitigation", "safety", "expert", or "warning"
      - title: (short header for the suggestion)
      - description: (detailed reasoning or action step)
    - spatialTelemetry: (array of objects for specific damage areas with high-precision bounding boxes)
      - label: (short name, e.g. "Shear Crack")
      - severity: "Minor" or "Severe"
      - box_2d: [ymin, xmin, ymax, xmax] (highly precise normalized coordinates from 0-1000)
      - characteristics: (detailed description of the damage type/properties)
      - location: (contextual location on the building element, e.g., "mid-span of the first-floor perimeter beam")
      - confidenceScore: (confidence number between 0 and 1 for this specific localization)

    Observe with extreme precision for:
    1. Hairline and structural cracks (width, length, direction)
    2. Exposed rebar or concrete spalling
    3. Global and local tilting or structural deformation
    4. Differential settlement indicators
  `;

  // Extract base64 data and mime type
  const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image format");
  }
  const mimeType = match[1];
  const data = match[2];

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: prompt },
        { 
          inlineData: {
            data,
            mimeType
          }
        }
      ]
    },
    config: {
      responseMimeType: "application/json"
    }
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Analysis failed: Empty response from AI.");
  }

  try {
    return JSON.parse(responseText) as DamageAnalysis;
  } catch (e) {
    console.error("Failed to parse Gemini response:", responseText);
    
    // Fallback: try to find JSON block if the model included text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as DamageAnalysis;
      } catch (innerError) {
        throw new Error("Analysis failed to produce valid JSON data.");
      }
    }
    
    throw new Error("Analysis failed to produce structured data.");
  }
}
