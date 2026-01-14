import { GoogleGenAI } from "@google/genai";
import { Tone } from "../types";
import { TONE_OPTIONS } from "../constants";

const apiKey = process.env.API_KEY;

// Initialize the client.
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const translateTextStream = async (
  text: string,
  sourceLang: string,
  targetLang: string,
  tone: Tone,
  onChunk: (text: string) => void,
  onMetadata?: (meta: { code: string; confidence: number }) => void
): Promise<void> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const model = "gemini-3-flash-preview";
  
  const sourceLabel = sourceLang === 'auto' ? "auto-detect" : sourceLang;
  const toneOption = TONE_OPTIONS.find(t => t.value === tone) || TONE_OPTIONS[0]; // Fallback to Casual (first option)
  
  // Prompt engineering for metadata + translation
  const prompt = `
    Task: Translate the following text from ${sourceLabel} to ${targetLang}.
    
    Instructions:
    1. If source language is 'auto-detect', determine the language code (ISO 639-1) and a confidence score (0-100).
    2. The FIRST line of your response MUST be strictly in this format: 
       ### METADATA: {code}, {confidence}
       (Example: ### METADATA: fr, 98)
       If source was provided explicitly, still output this line with that code and 100 confidence.
    3. The following lines should contain the translation.
    4. Maintain original formatting.
    
    TONE & STYLE INSTRUCTIONS (${toneOption.label}):
    ${toneOption.instruction}
    
    Text to translate:
    """
    ${text}
    """
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    let buffer = '';
    let metaParsed = false;

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (!text) continue;

      if (!metaParsed) {
        buffer += text;
        const newlineIdx = buffer.indexOf('\n');
        
        // If we found a newline, try to extract metadata
        if (newlineIdx !== -1) {
          const firstLine = buffer.slice(0, newlineIdx).trim();
          const remaining = buffer.slice(newlineIdx + 1); // Keep the rest
          
          // Parse metadata
          const match = firstLine.match(/### METADATA:\s*([a-zA-Z-]+),\s*(\d+)/);
          if (match && onMetadata) {
            onMetadata({ 
              code: match[1].toLowerCase(), 
              confidence: parseInt(match[2], 10) 
            });
          }

          if (remaining) onChunk(remaining);
          
          buffer = '';
          metaParsed = true;
        }
      } else {
        // Already parsed metadata, just stream content
        onChunk(text);
      }
    }
    
    // Fallback: If no newline was ever found (very short text?), flush buffer as content
    if (!metaParsed && buffer) {
        // Check if buffer looks like metadata only? unlikely if prompt works.
        // If it starts with ### METADATA, stripped it.
        const match = buffer.match(/### METADATA:\s*([a-zA-Z-]+),\s*(\d+)/);
        if (match && onMetadata) {
             onMetadata({ 
              code: match[1].toLowerCase(), 
              confidence: parseInt(match[2], 10) 
            });
            // If there's nothing else, we send nothing.
        } else {
            onChunk(buffer);
        }
    }

  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
};

export const polishTextStream = async (
  text: string,
  tone: Tone,
  onChunk: (text: string) => void
): Promise<void> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const model = "gemini-3-flash-preview";
  const toneOption = TONE_OPTIONS.find(t => t.value === tone) || TONE_OPTIONS[0];

  const prompt = `
    Task: Proofread and polish the following text. 
    Fix grammar, spelling, and improve flow.
    
    Target Tone: ${toneOption.label}
    Style Guide: ${toneOption.instruction}
    
    Constraints:
    1. Keep the language same as source.
    2. Do not explain changes.
    3. Return only the polished text.
    
    Text:
    """
    ${text}
    """
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      contents: prompt,
      config: {
         thinkingConfig: { thinkingBudget: 0 }
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Polishing error:", error);
    throw error;
  }
};

export const getPhonetics = async (
    text: string,
    language: string
  ): Promise<string> => {
    if (!apiKey) throw new Error("API Key missing");
    
    const model = "gemini-3-flash-preview";
    const prompt = `
      Task: Provide the phonetic transcription (Romanization/IPA) for the text below which is in language code '${language}'.
      
      Instructions:
      1. Return ONLY the phonetic text.
      2. No explanations.
      3. If the language uses Latin script and pronunciation is obvious (like English/Spanish), just return "Phonetics not available/necessary for this language" or simple IPA.
      4. Ideally, provide a reading aid for a learner.
      
      Text:
      "${text}"
    `;
  
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    
    return result.text || "";
  };