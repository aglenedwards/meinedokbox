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
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `You are an expert German document analyzer. Analyze the document image(s) and extract:
1. All visible text (OCR) from ALL pages
2. Document type/category - choose the MOST SPECIFIC category from these 15 options:
   
   - Finanzen & Banken: Bank statements (Kontoauszüge), credit documents, wire transfers (Überweisungen), credit card statements (Kreditkartenabrechnung), investment statements (Depotauszüge), trading confirmations, IBAN, account numbers, BIC, bank names (Sparkasse, Commerzbank, Deutsche Bank, Volksbank), Kontostand, Gutschrift, Lastschrift
   
   - Versicherungen: Insurance policies (Versicherungspolice), policy documents, liability insurance (Haftpflicht), household insurance (Hausrat), car insurance (Kfz-Versicherung), health insurance documents, damage claims (Schadensmeldung), premium notices (Beitragsbescheid), renewal letters (Verlängerungsschreiben), insurance company names (Allianz, ERGO, HUK, Debeka), Versicherungsnummer, Versicherungsschein
   
   - Steuern & Buchhaltung: Tax notices (Steuerbescheid), tax returns (Steuererklärung), VAT documents (Umsatzsteuer), tax assessments, business receipts for tax deduction, documents from Finanzamt, tax ID (Steuer-ID), Steuernummer, donation receipts (Spendenbescheinigung), tax refunds (Steuererstattung), professional invoices for tax purposes
   
   - Arbeit & Gehalt: Employment contracts (Arbeitsvertrag), pay slips (Lohnzettel, Gehaltsabrechnung), salary statements, bonus statements (Prämien), overtime records (Überstunden), warnings (Abmahnung), termination letters (Kündigung), work certificates (Arbeitszeugnis), employer/employee, gross/net salary (Brutto/Netto), Sozialversicherung, Lohnsteuer
   
   - Verträge & Abos: Electricity contracts (Stromvertrag), internet/DSL, mobile phone contracts (Mobilfunkvertrag), streaming services (Netflix, Spotify, Disney+), gym membership (Fitnessstudio), magazine subscriptions (Zeitschriftenabo), contract terms (Vertragslaufzeit), cancellation (Kündigung), monthly fee (Monatsbeitrag), annual fee (Jahresgebühr), provider (Anbieter), tariff, renewal (Verlängerung)
   
   - Behörden & Amtliches: ID cards (Personalausweis), passports (Reisepass), birth certificates (Geburtsurkunde), marriage certificates (Heiratsurkunde), driver's license (Führerschein), vehicle registration (Fahrzeugzulassung), residence permit (Aufenthaltstitel), visa documents, registration office (Einwohnermeldeamt), city administration (Stadtverwaltung), government office (Amt, Behörde), official notices (Bescheid), court documents (Gerichtsbescheid)
   
   - Gesundheit & Arzt: Medical invoices (Arztrechnungen), doctor's bills, hospital invoices (Krankenhausrechnung), doctor's letters (Arztbriefe), medical reports, prescriptions (Rezepte), health insurance documents (Krankenkasse), vaccination records (Impfpass), lab results (Laborbefunde), diagnosis (Diagnose), medical practice (Arztpraxis), treatment (Behandlung), therapy invoices, dermatology (Dermatologie), physiotherapy (Physiotherapie), dentist bills (Zahnarztrechnung), pharmacy receipts (Apothekenrechnung)
   
   - Wohnen & Immobilien: Rental contracts (Mietvertrag), utility bills (Nebenkostenabrechnung), heating cost statement (Heizkostenabrechnung), electricity bills (Stromrechnung), water bills (Wasserrechnung), property tax (Grundsteuer), construction documents, rent receipts (Mietquittung), landlord correspondence (Vermieter), tenant (Mieter), square meters (Quadratmeter), energy certificate (Energieausweis), property purchase contracts
   
   - Auto & Mobilität: Vehicle registration documents (Fahrzeugbrief, Zulassungsbescheinigung), car tax (Kfz-Steuer), TÜV inspection reports, ASU, workshop invoices (Werkstattrechnung), car repairs, license plate (Kennzeichen), vehicle maintenance (Wartung), fuel receipts (Tankbelege), parking tickets (Parktickets), car insurance documents, leasing contracts
   
   - Schule & Ausbildung: School certificates (Zeugnisse), report cards (Schulzeugnisse), school confirmation, university documents (Hochschulunterlagen), student certificates (Immatrikulationsbescheinigung), transcripts (Notenauszüge), diplomas, degrees (Abschluss, Bachelor, Master), exam results (Prüfungsergebnisse), school, grades (Noten), study, university (Universität), apprenticeship contracts (Ausbildungsvertrag)
   
   - Familie & Kinder: Child benefit (Kindergeld), birth certificates (Geburtsurkunde), daycare contracts (Kita-Vertrag), daycare invoices, child support (Unterhalt), youth welfare office (Jugendamt), parental allowance (Elterngeld), parental leave (Elternzeit), child custody documents (Sorgerecht), adoption papers
   
   - Rente & Vorsorge: Pension insurance (Rentenversicherung), retirement planning documents, life insurance (Lebensversicherung), pension notice (Rentenbescheid), pension statements, retirement benefits, Riester pension, Rürup pension, company pension (Betriebsrente), pension contributions (Beitragszeit), pension fund statements
   
   - Einkäufe & Online-Bestellungen: Online shopping receipts, order confirmations from retailers (Amazon, eBay, Otto, Zalando, MediaMarkt), delivery tracking, parcel notifications, product warranties (Garantie), return confirmations, purchase receipts for consumer goods, delivery date, order number (Bestellnummer), tracking number, consumer electronics invoices
   
   - Reisen & Freizeit: Flight bookings (Flugbuchung), hotel reservations (Hotelbuchung), train tickets (Bahnticket), event tickets (Veranstaltungstickets), concert tickets, travel documents, travel insurance, booking confirmations, cancellation notices, travel agencies, booking number, flight number, hotel confirmation, membership cards (Mitgliedskarten)
   
   - Sonstiges / Privat: Personal letters, private correspondence, notes, photos, memos, greeting cards, invitations, anything that doesn't clearly fit other categories

CRITICAL CATEGORIZATION RULES - Apply these priority rules when multiple categories could match:
1. Medical invoices (containing medical terms like Behandlung, Diagnose, Arzt, Klinik, Therapie, Dermatologie, etc.) → ALWAYS "Gesundheit & Arzt"
2. Invoices from government offices (Finanzamt, Gemeinde, Stadt, etc.) → "Behörden & Amtliches"
3. Tax-related professional invoices or donation receipts → "Steuern & Buchhaltung"
4. Utility bills (Strom, Gas, Wasser, Heizung) → "Wohnen & Immobilien"
5. Only general retail/e-commerce purchases → "Einkäufe & Online-Bestellungen"

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
     * "rechnung" - Invoices and bills requiring payment (Rechnung, Invoice, Faktura, Bill, Zahlungsaufforderung)
     * "rechnung_bezahlt" - Invoices that are already marked as PAID (contains words: "BEZAHLT", "PAID", "AUSGEGLICHEN", "BEGLICHEN")
     * "mahnung" - Payment reminders and dunning notices (Mahnung, Zahlungserinnerung, Reminder, Inkasso) - HIGH PRIORITY
     * "lohnabrechnung" - Salary/payroll statements
     * "spende" - Donation receipts
   
   CRITICAL INVOICE DETECTION RULES:
   - Look for invoice keywords: "Rechnung", "Invoice", "Faktura", "Bill", "Zahlungsaufforderung", "Forderung", "Zahlung", "Betrag", "Gesamtsumme"
   - Look for company/sender names with amounts → usually invoices
   - Look for payment terms: "Zahlungsfrist", "fällig am", "Zahlung bis", "Zahlungsziel"
   - If document contains "BEZAHLT", "PAID", "AUSGEGLICHEN" → add "rechnung_bezahlt" tag
   - If document contains "Mahnung", "Zahlungserinnerung", "2. Mahnung" → add "mahnung" tag (HIGHEST PRIORITY for unpaid status)
   - Service invoices (Umzug, Handwerker, Dienstleistung, Service) are ALWAYS "rechnung" unless marked as paid
   
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
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `You are an expert German document analyzer. Analyze the provided document text and determine:
1. Document type/category - choose the MOST SPECIFIC category from these 15 options:
   
   - Finanzen & Banken: Bank statements (Kontoauszüge), credit documents, wire transfers (Überweisungen), credit card statements (Kreditkartenabrechnung), investment statements (Depotauszüge), trading confirmations, IBAN, account numbers, BIC, bank names (Sparkasse, Commerzbank, Deutsche Bank, Volksbank), Kontostand, Gutschrift, Lastschrift
   
   - Versicherungen: Insurance policies (Versicherungspolice), policy documents, liability insurance (Haftpflicht), household insurance (Hausrat), car insurance (Kfz-Versicherung), health insurance documents, damage claims (Schadensmeldung), premium notices (Beitragsbescheid), renewal letters (Verlängerungsschreiben), insurance company names (Allianz, ERGO, HUK, Debeka), Versicherungsnummer, Versicherungsschein
   
   - Steuern & Buchhaltung: Tax notices (Steuerbescheid), tax returns (Steuererklärung), VAT documents (Umsatzsteuer), tax assessments, business receipts for tax deduction, documents from Finanzamt, tax ID (Steuer-ID), Steuernummer, donation receipts (Spendenbescheinigung), tax refunds (Steuererstattung), professional invoices for tax purposes
   
   - Arbeit & Gehalt: Employment contracts (Arbeitsvertrag), pay slips (Lohnzettel, Gehaltsabrechnung), salary statements, bonus statements (Prämien), overtime records (Überstunden), warnings (Abmahnung), termination letters (Kündigung), work certificates (Arbeitszeugnis), employer/employee, gross/net salary (Brutto/Netto), Sozialversicherung, Lohnsteuer
   
   - Verträge & Abos: Electricity contracts (Stromvertrag), internet/DSL, mobile phone contracts (Mobilfunkvertrag), streaming services (Netflix, Spotify, Disney+), gym membership (Fitnessstudio), magazine subscriptions (Zeitschriftenabo), contract terms (Vertragslaufzeit), cancellation (Kündigung), monthly fee (Monatsbeitrag), annual fee (Jahresgebühr), provider (Anbieter), tariff, renewal (Verlängerung)
   
   - Behörden & Amtliches: ID cards (Personalausweis), passports (Reisepass), birth certificates (Geburtsurkunde), marriage certificates (Heiratsurkunde), driver's license (Führerschein), vehicle registration (Fahrzeugzulassung), residence permit (Aufenthaltstitel), visa documents, registration office (Einwohnermeldeamt), city administration (Stadtverwaltung), government office (Amt, Behörde), official notices (Bescheid), court documents (Gerichtsbescheid)
   
   - Gesundheit & Arzt: Medical invoices (Arztrechnungen), doctor's bills, hospital invoices (Krankenhausrechnung), doctor's letters (Arztbriefe), medical reports, prescriptions (Rezepte), health insurance documents (Krankenkasse), vaccination records (Impfpass), lab results (Laborbefunde), diagnosis (Diagnose), medical practice (Arztpraxis), treatment (Behandlung), therapy invoices, dermatology (Dermatologie), physiotherapy (Physiotherapie), dentist bills (Zahnarztrechnung), pharmacy receipts (Apothekenrechnung)
   
   - Wohnen & Immobilien: Rental contracts (Mietvertrag), utility bills (Nebenkostenabrechnung), heating cost statement (Heizkostenabrechnung), electricity bills (Stromrechnung), water bills (Wasserrechnung), property tax (Grundsteuer), construction documents, rent receipts (Mietquittung), landlord correspondence (Vermieter), tenant (Mieter), square meters (Quadratmeter), energy certificate (Energieausweis), property purchase contracts
   
   - Auto & Mobilität: Vehicle registration documents (Fahrzeugbrief, Zulassungsbescheinigung), car tax (Kfz-Steuer), TÜV inspection reports, ASU, workshop invoices (Werkstattrechnung), car repairs, license plate (Kennzeichen), vehicle maintenance (Wartung), fuel receipts (Tankbelege), parking tickets (Parktickets), car insurance documents, leasing contracts
   
   - Schule & Ausbildung: School certificates (Zeugnisse), report cards (Schulzeugnisse), school confirmation, university documents (Hochschulunterlagen), student certificates (Immatrikulationsbescheinigung), transcripts (Notenauszüge), diplomas, degrees (Abschluss, Bachelor, Master), exam results (Prüfungsergebnisse), school, grades (Noten), study, university (Universität), apprenticeship contracts (Ausbildungsvertrag)
   
   - Familie & Kinder: Child benefit (Kindergeld), birth certificates (Geburtsurkunde), daycare contracts (Kita-Vertrag), daycare invoices, child support (Unterhalt), youth welfare office (Jugendamt), parental allowance (Elterngeld), parental leave (Elternzeit), child custody documents (Sorgerecht), adoption papers
   
   - Rente & Vorsorge: Pension insurance (Rentenversicherung), retirement planning documents, life insurance (Lebensversicherung), pension notice (Rentenbescheid), pension statements, retirement benefits, Riester pension, Rürup pension, company pension (Betriebsrente), pension contributions (Beitragszeit), pension fund statements
   
   - Einkäufe & Online-Bestellungen: Online shopping receipts, order confirmations from retailers (Amazon, eBay, Otto, Zalando, MediaMarkt), delivery tracking, parcel notifications, product warranties (Garantie), return confirmations, purchase receipts for consumer goods, delivery date, order number (Bestellnummer), tracking number, consumer electronics invoices
   
   - Reisen & Freizeit: Flight bookings (Flugbuchung), hotel reservations (Hotelbuchung), train tickets (Bahnticket), event tickets (Veranstaltungstickets), concert tickets, travel documents, travel insurance, booking confirmations, cancellation notices, travel agencies, booking number, flight number, hotel confirmation, membership cards (Mitgliedskarten)
   
   - Sonstiges / Privat: Personal letters, private correspondence, notes, photos, memos, greeting cards, invitations, anything that doesn't clearly fit other categories

CRITICAL CATEGORIZATION RULES - Apply these priority rules when multiple categories could match:
1. Medical invoices (containing medical terms like Behandlung, Diagnose, Arzt, Klinik, Therapie, Dermatologie, etc.) → ALWAYS "Gesundheit & Arzt"
2. Invoices from government offices (Finanzamt, Gemeinde, Stadt, etc.) → "Behörden & Amtliches"
3. Tax-related professional invoices or donation receipts → "Steuern & Buchhaltung"
4. Utility bills (Strom, Gas, Wasser, Heizung) → "Wohnen & Immobilien"
5. Only general retail/e-commerce purchases → "Einkäufe & Online-Bestellungen"

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
     * "rechnung" - Invoices and bills requiring payment (Rechnung, Invoice, Faktura, Bill, Zahlungsaufforderung)
     * "rechnung_bezahlt" - Invoices that are already marked as PAID (contains words: "BEZAHLT", "PAID", "AUSGEGLICHEN", "BEGLICHEN")
     * "mahnung" - Payment reminders and dunning notices (Mahnung, Zahlungserinnerung, Reminder, Inkasso) - HIGH PRIORITY
     * "lohnabrechnung" - Salary/payroll statements
     * "spende" - Donation receipts
   
   CRITICAL INVOICE DETECTION RULES:
   - Look for invoice keywords: "Rechnung", "Invoice", "Faktura", "Bill", "Zahlungsaufforderung", "Forderung", "Zahlung", "Betrag", "Gesamtsumme"
   - Look for company/sender names with amounts → usually invoices
   - Look for payment terms: "Zahlungsfrist", "fällig am", "Zahlung bis", "Zahlungsziel"
   - If document contains "BEZAHLT", "PAID", "AUSGEGLICHEN" → add "rechnung_bezahlt" tag
   - If document contains "Mahnung", "Zahlungserinnerung", "2. Mahnung" → add "mahnung" tag (HIGHEST PRIORITY for unpaid status)
   - Service invoices (Umzug, Handwerker, Dienstleistung, Service) are ALWAYS "rechnung" unless marked as paid
   
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
      temperature: 0,
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
