import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface DocumentAnalysisResult {
  extractedText: string;
  category: string;
  title: string;
  confidence: number;
  // Phase 2: Smart metadata extraction
  extractedDate?: string; // ISO date string
  amount?: number;
  sender?: string;
}

export interface ImageWithMimeType {
  base64: string;
  mimeType: string;
}

export async function analyzeDocument(
  images: ImageWithMimeType[]
): Promise<DocumentAnalysisResult> {
  try {
    console.log(`Analyzing document with ${images.length} page(s)`);
    
    // Build content with all images for multi-page documents
    const imageContents = images.map(img => {
      console.log(`  - Adding page with MIME type: ${img.mimeType}`);
      return {
        type: "image_url" as const,
        image_url: {
          url: `data:${img.mimeType};base64,${img.base64}`
        }
      };
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert German document analyzer. Analyze the document image(s) and extract:
1. All visible text (OCR) from ALL pages
2. Document type/category - choose the MOST SPECIFIC category from these 15 options:
   
   - Finanzen & Banken: Bank statements (Kontoauszüge), credit documents, wire transfers, credit card statements, IBAN, account numbers, bank names (Sparkasse, Commerzbank, Deutsche Bank)
   
   - Versicherungen: Insurance policies (Policen), liability (Haftpflicht), household (Hausrat), car insurance (Kfz-Versicherung), damage claims (Schadensmeldungen), insurance company names
   
   - Steuern & Buchhaltung: Tax notices (Steuerbescheide), payroll tax, receipts, invoices for tax purposes, documents from Finanzamt, tax ID (Steuer-ID), income/expenses statements
   
   - Arbeit & Gehalt: Employment contracts (Arbeitsvertrag), pay slips (Lohnzettel), salary statements (Gehaltsabrechnung), warnings, work certificates, employer/employee, gross/net salary (Brutto/Netto)
   
   - Verträge & Abos: Electricity, internet, mobile phone, streaming services, gym membership, contract terms (Vertragslaufzeit), cancellation (Kündigung), provider, tariff
   
   - Behörden & Amtliches: ID cards, birth certificates, driver's license, registration office, city administration (Stadtverwaltung), government office (Amt, Behörde), official notices (Bescheid)
   
   - Gesundheit & Arzt: Doctor's letters (Arztbriefe), prescriptions (Rezepte), health insurance (Krankenkasse), vaccination records (Impfpass), lab results, diagnosis, medical practice
   
   - Wohnen & Immobilien: Rental contracts (Mietvertrag), utility bills (Nebenkostenabrechnung), property tax (Grundsteuer), construction documents, rent, landlord (Vermieter), square meters, energy certificate
   
   - Auto & Mobilität: Vehicle registration (Fahrzeugbrief), car tax (Kfz-Steuer), TÜV inspection, workshop invoices, license plate (Kennzeichen), vehicle maintenance
   
   - Schule & Ausbildung: School certificates (Zeugnisse), school confirmation, university documents, transcripts, school, grades, study, university, degree (Abschluss)
   
   - Familie & Kinder: Child benefit (Kindergeld), birth certificates, daycare (Kita), child support (Unterhalt), youth welfare office (Jugendamt), parental allowance (Elterngeld)
   
   - Rente & Vorsorge: Pension insurance, retirement planning, life insurance, pension notice (Rentenbescheid), pension, contributions (Beitragszeit)
   
   - Einkäufe & Online-Bestellungen: Order confirmations, warranties, returns, purchase receipts, Amazon, Otto, delivery date, order number, warranty
   
   - Reisen & Freizeit: Flight/hotel bookings, tickets, travel documents, memberships, booking number, flight, hotel, travel, membership
   
   - Sonstiges / Privat: Personal letters, notes, photos, memos, anything that doesn't clearly fit other categories

3. A concise, descriptive German title for the document (e.g., "Nebenkostenabrechnung 2024", "Stromrechnung Januar 2025")
4. Your confidence level (0-1)
5. Smart metadata extraction:
   - extractedDate: The document date (invoice date, statement date, etc.) in ISO format (YYYY-MM-DD). Extract the most relevant date from the document.
   - amount: The main monetary amount (e.g., invoice total, salary amount, balance). Extract as a number, use negative for debits/expenses.
   - sender: The sender/issuer of the document (e.g., company name, authority, institution)

Important: 
- Choose the MOST SPECIFIC category based on keywords and document content
- Create a meaningful title based on the document content
- If multiple pages are provided, combine all text from all pages
- Use high confidence (>0.8) when clear keywords match
- For metadata: Only extract if clearly visible in the document. Use null if not found.

Respond with JSON in this format:
{
  "extractedText": "full extracted text from all pages",
  "category": "category name (exact match from the 15 categories above)",
  "title": "descriptive document title",
  "confidence": 0.95,
  "extractedDate": "2024-01-15" or null,
  "amount": 123.45 or null,
  "sender": "Company/Institution Name" or null
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
      textLength: result.extractedText?.length || 0,
      extractedDate: result.extractedDate,
      amount: result.amount,
      sender: result.sender
    });
    
    return {
      extractedText: result.extractedText || "",
      category: result.category || "Sonstiges / Privat",
      title: result.title || "Unbekanntes Dokument",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      extractedDate: result.extractedDate || undefined,
      amount: result.amount || undefined,
      sender: result.sender || undefined,
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

export async function analyzeDocumentFromText(
  extractedText: string
): Promise<DocumentAnalysisResult> {
  try {
    console.log(`Analyzing PDF document from extracted text (${extractedText.length} characters)`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert German document analyzer. Analyze the provided document text and determine:
1. Document type/category - choose the MOST SPECIFIC category from these 15 options:
   
   - Finanzen & Banken: Bank statements (Kontoauszüge), credit documents, wire transfers, credit card statements, IBAN, account numbers, bank names (Sparkasse, Commerzbank, Deutsche Bank)
   
   - Versicherungen: Insurance policies (Policen), liability (Haftpflicht), household (Hausrat), car insurance (Kfz-Versicherung), damage claims (Schadensmeldungen), insurance company names
   
   - Steuern & Buchhaltung: Tax notices (Steuerbescheide), payroll tax, receipts, invoices for tax purposes, documents from Finanzamt, tax ID (Steuer-ID), income/expenses statements
   
   - Arbeit & Gehalt: Employment contracts (Arbeitsvertrag), pay slips (Lohnzettel), salary statements (Gehaltsabrechnung), warnings, work certificates, employer/employee, gross/net salary (Brutto/Netto)
   
   - Verträge & Abos: Electricity, internet, mobile phone, streaming services, gym membership, contract terms (Vertragslaufzeit), cancellation (Kündigung), provider, tariff
   
   - Behörden & Amtliches: ID cards, birth certificates, driver's license, registration office, city administration (Stadtverwaltung), government office (Amt, Behörde), official notices (Bescheid)
   
   - Gesundheit & Arzt: Doctor's letters (Arztbriefe), prescriptions (Rezepte), health insurance (Krankenkasse), vaccination records (Impfpass), lab results, diagnosis, medical practice
   
   - Wohnen & Immobilien: Rental contracts (Mietvertrag), utility bills (Nebenkostenabrechnung), property tax (Grundsteuer), construction documents, rent, landlord (Vermieter), square meters, energy certificate
   
   - Auto & Mobilität: Vehicle registration (Fahrzeugbrief), car tax (Kfz-Steuer), TÜV inspection, workshop invoices, license plate (Kennzeichen), vehicle maintenance
   
   - Schule & Ausbildung: School certificates (Zeugnisse), school confirmation, university documents, transcripts, school, grades, study, university, degree (Abschluss)
   
   - Familie & Kinder: Child benefit (Kindergeld), birth certificates, daycare (Kita), child support (Unterhalt), youth welfare office (Jugendamt), parental allowance (Elterngeld)
   
   - Rente & Vorsorge: Pension insurance, retirement planning, life insurance, pension notice (Rentenbescheid), pension, contributions (Beitragszeit)
   
   - Einkäufe & Online-Bestellungen: Order confirmations, warranties, returns, purchase receipts, Amazon, Otto, delivery date, order number, warranty
   
   - Reisen & Freizeit: Flight/hotel bookings, tickets, travel documents, memberships, booking number, flight, hotel, travel, membership
   
   - Sonstiges / Privat: Personal letters, notes, photos, memos, anything that doesn't clearly fit other categories

2. A concise, descriptive German title for the document (e.g., "Nebenkostenabrechnung 2024", "Stromrechnung Januar 2025")
3. Your confidence level (0-1)
4. Smart metadata extraction:
   - extractedDate: The document date (invoice date, statement date, etc.) in ISO format (YYYY-MM-DD)
   - amount: The main monetary amount (e.g., invoice total, salary amount, balance). Use negative for debits/expenses.
   - sender: The sender/issuer of the document (e.g., company name, authority, institution)

Important: 
- Choose the MOST SPECIFIC category based on keywords and document content
- Create a meaningful title based on the document content
- Use high confidence (>0.8) when clear keywords match
- For metadata: Only extract if clearly visible in the document. Use null if not found.

Respond with JSON in this format:
{
  "category": "category name (exact match from the 15 categories above)",
  "title": "descriptive document title",
  "confidence": 0.95,
  "extractedDate": "2024-01-15" or null,
  "amount": 123.45 or null,
  "sender": "Company/Institution Name" or null
}`
        },
        {
          role: "user",
          content: `Please analyze this document text and categorize it:\n\n${extractedText.substring(0, 8000)}`
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    console.log('OpenAI Text Analysis Result:', {
      category: result.category,
      title: result.title,
      confidence: result.confidence,
      extractedDate: result.extractedDate,
      amount: result.amount,
      sender: result.sender
    });
    
    return {
      extractedText: extractedText,
      category: result.category || "Sonstiges / Privat",
      title: result.title || "Unbekanntes Dokument",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      extractedDate: result.extractedDate || undefined,
      amount: result.amount || undefined,
      sender: result.sender || undefined,
    };
  } catch (error) {
    console.error("Failed to analyze document from text:", error);
    throw new Error("Document text analysis failed: " + (error as Error).message);
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
