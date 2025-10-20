import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface DocumentAnalysisResult {
  extractedText: string;
  category: string;
  title: string;
  confidence: number;
}

export async function analyzeDocument(
  base64Images: string | string[],
  mimeType: string = 'image/jpeg'
): Promise<DocumentAnalysisResult> {
  try {
    const images = Array.isArray(base64Images) ? base64Images : [base64Images];
    
    console.log(`Analyzing document with ${images.length} page(s), MIME type: ${mimeType}`);
    
    // Build content with all images for multi-page documents
    const imageContents = images.map(base64Image => ({
      type: "image_url" as const,
      image_url: {
        url: `data:${mimeType};base64,${base64Image}`
      }
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert document analyzer. Analyze the document image(s) and extract:
1. All visible text (OCR) from ALL pages
2. Document type/category from these options:
   - Rechnung: Invoices, bills, receipts, Abrechnungen (settlements), Endabrechnungen, Nebenkostenabrechnungen, payment requests, utility bills
   - Vertrag: Contracts, agreements, terms of service, Mietverträge, Arbeitsverträge
   - Versicherung: Insurance documents, policies, claims
   - Brief: Letters, correspondence, notices
   - Sonstiges: Everything else that doesn't fit the above categories
3. A concise, descriptive German title for the document (NOT "Unbekanntes Dokument")
4. Your confidence level (0-1)

Important: 
- Classify Abrechnungen, Endabrechnungen, and Nebenkostenabrechnungen as "Rechnung"
- Create a meaningful title based on the document content (e.g., "Nebenkostenabrechnung 2024", "Stromrechnung Januar 2025")
- If multiple pages are provided, combine all text from all pages

Respond with JSON in this format:
{
  "extractedText": "full extracted text from all pages",
  "category": "category name",
  "title": "descriptive document title",
  "confidence": 0.95
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: images.length > 1 
                ? `Please analyze this ${images.length}-page document and extract all information from all pages.`
                : "Please analyze this document and extract all information."
            },
            ...imageContents
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4096,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    console.log('OpenAI Analysis Result:', {
      category: result.category,
      title: result.title,
      confidence: result.confidence,
      textLength: result.extractedText?.length || 0
    });
    
    return {
      extractedText: result.extractedText || "",
      category: result.category || "Sonstiges",
      title: result.title || "Unbekanntes Dokument",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
    };
  } catch (error) {
    console.error("Failed to analyze document:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
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
