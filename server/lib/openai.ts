import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface DocumentAnalysisResult {
  extractedText: string;
  category: string;
  title: string;
  confidence: number;
}

export async function analyzeDocument(base64Image: string): Promise<DocumentAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert document analyzer. Analyze the document image and extract:
1. All visible text (OCR)
2. Document type/category (Rechnung, Vertrag, Versicherung, Brief, or Sonstiges)
3. A concise title for the document
4. Your confidence level (0-1)

Respond with JSON in this format:
{
  "extractedText": "full extracted text",
  "category": "category name",
  "title": "document title",
  "confidence": 0.95
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this document and extract all information."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      extractedText: result.extractedText || "",
      category: result.category || "Sonstiges",
      title: result.title || "Unbekanntes Dokument",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
    };
  } catch (error) {
    console.error("Failed to analyze document:", error);
    throw new Error("Document analysis failed: " + (error as Error).message);
  }
}

export async function searchDocuments(query: string, documents: Array<{ id: string, extractedText: string, title: string }>): Promise<string[]> {
  if (!query || documents.length === 0) {
    return [];
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a document search assistant. Given a search query and a list of documents, return the IDs of documents that match the query.
Respond with JSON in this format: { "matchingIds": ["id1", "id2", ...] }`
        },
        {
          role: "user",
          content: `Search query: "${query}"

Documents:
${documents.map(d => `ID: ${d.id}, Title: ${d.title}, Content: ${d.extractedText.substring(0, 200)}...`).join('\n\n')}`
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.matchingIds || [];
  } catch (error) {
    console.error("Failed to search documents:", error);
    return [];
  }
}
