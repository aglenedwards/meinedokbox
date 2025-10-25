import { AzureOpenAI } from "openai";

// Azure OpenAI EU deployment for GDPR compliance - all data stays in EU
const azureOpenAI = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: "2024-12-01-preview",
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME
});

export interface DocumentAnalysisResult {
  extractedText: string;
  category: string;
  title: string;
  confidence: number;
  // Phase 2: Smart metadata extraction
  extractedDate?: string; // ISO date string
  amount?: number;
  sender?: string;
  // Auto-rotation detection
  needsRotation?: boolean; // true if document is upside down (180°)
  // Phase 3: Smart folders & scenarios
  year?: number; // Year the document relates to (for tax/time-based filtering)
  documentDate?: string; // ISO date string - exact date from document
  systemTags?: string[]; // Auto-assigned tags (e.g., "steuerrelevant", "geschäftlich")
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

    const response = await azureOpenAI.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o",
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
6. Document orientation:
   - needsRotation: Detect if the document is upside down (rotated 180 degrees). Set to true if text appears inverted/upside down, false otherwise.
7. Year & Smart Tags (for intelligent document organization):
   - year: Extract the year this document relates to (e.g., 2024 for "Rechnung 2024", 2023 for "Steuerbescheid 2023"). This is used for time-based filtering.
   - documentDate: The exact date from the document in ISO format (YYYY-MM-DD) if available
   - systemTags: Automatically assign relevant tags from this list based on document content:
     * "steuerrelevant" - Tax-relevant documents (invoices, receipts, tax notices, salary statements, donations)
     * "geschäftlich" - Business-related documents (if indicators like "Firma", "GmbH", "Rechnung an Firma" are present)
     * "privat" - Private/personal documents (personal letters, private contracts)
     * "versicherung" - Insurance documents (policies, claims, insurance correspondence)
     * "miete" - Rent-related (rental contracts, utility bills, rent receipts)
     * "gesundheit" - Health-related (medical documents, health insurance, prescriptions)
     * "bank" - Banking documents (statements, transfers, bank correspondence)
     * "vertrag" - Contracts (employment, service contracts, subscriptions)
     * "rechnung" - Invoices and bills
     * "lohnabrechnung" - Salary/payroll statements
     * "spende" - Donation receipts
   
   Important for systemTags: Assign ALL tags that apply. A document can have multiple tags (e.g., ["steuerrelevant", "geschäftlich", "rechnung"]).

Important: 
- Choose the MOST SPECIFIC category based on keywords and document content
- Create a meaningful title based on the document content
- If multiple pages are provided, combine all text from all pages
- Use high confidence (>0.8) when clear keywords match
- For metadata: Only extract if clearly visible in the document. Use null if not found.
- Check text orientation carefully - if text appears upside down, set needsRotation to true

Respond with JSON in this format:
{
  "extractedText": "full extracted text from all pages",
  "category": "category name (exact match from the 15 categories above)",
  "title": "descriptive document title",
  "confidence": 0.95,
  "extractedDate": "2024-01-15" or null,
  "amount": 123.45 or null,
  "sender": "Company/Institution Name" or null,
  "needsRotation": false,
  "year": 2024 or null,
  "documentDate": "2024-01-15" or null,
  "systemTags": ["steuerrelevant", "rechnung"] or []
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
      sender: result.sender,
      needsRotation: result.needsRotation,
      year: result.year,
      documentDate: result.documentDate,
      systemTags: result.systemTags
    });
    
    return {
      extractedText: result.extractedText || "",
      category: result.category || "Sonstiges / Privat",
      title: result.title || "Unbekanntes Dokument",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      extractedDate: result.extractedDate || undefined,
      amount: result.amount || undefined,
      sender: result.sender || undefined,
      needsRotation: result.needsRotation || false,
      year: result.year || undefined,
      documentDate: result.documentDate || undefined,
      systemTags: result.systemTags || [],
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
    
    const response = await azureOpenAI.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o",
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
5. Year & Smart Tags (for intelligent document organization):
   - year: Extract the year this document relates to (e.g., 2024 for "Rechnung 2024", 2023 for "Steuerbescheid 2023")
   - documentDate: The exact date from the document in ISO format (YYYY-MM-DD) if available
   - systemTags: Automatically assign relevant tags from this list based on document content:
     * "steuerrelevant" - Tax-relevant documents (invoices, receipts, tax notices, salary statements, donations)
     * "geschäftlich" - Business-related documents (if indicators like "Firma", "GmbH", "Rechnung an Firma" are present)
     * "privat" - Private/personal documents (personal letters, private contracts)
     * "versicherung" - Insurance documents (policies, claims, insurance correspondence)
     * "miete" - Rent-related (rental contracts, utility bills, rent receipts)
     * "gesundheit" - Health-related (medical documents, health insurance, prescriptions)
     * "bank" - Banking documents (statements, transfers, bank correspondence)
     * "vertrag" - Contracts (employment, service contracts, subscriptions)
     * "rechnung" - Invoices and bills
     * "lohnabrechnung" - Salary/payroll statements
     * "spende" - Donation receipts
   
   Important for systemTags: Assign ALL tags that apply. A document can have multiple tags (e.g., ["steuerrelevant", "geschäftlich", "rechnung"]).

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
  "sender": "Company/Institution Name" or null,
  "year": 2024 or null,
  "documentDate": "2024-01-15" or null,
  "systemTags": ["steuerrelevant", "rechnung"] or []
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
      sender: result.sender,
      year: result.year,
      documentDate: result.documentDate,
      systemTags: result.systemTags
    });
    
    return {
      extractedText: extractedText,
      category: result.category || "Sonstiges / Privat",
      title: result.title || "Unbekanntes Dokument",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      extractedDate: result.extractedDate || undefined,
      amount: result.amount || undefined,
      sender: result.sender || undefined,
      year: result.year || undefined,
      documentDate: result.documentDate || undefined,
      systemTags: result.systemTags || [],
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
    const response = await azureOpenAI.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o",
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
