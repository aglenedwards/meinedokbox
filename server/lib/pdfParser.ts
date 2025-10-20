export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for ESM compatibility
    const { PDFParse } = await import('pdf-parse');
    
    // Convert buffer to Uint8Array which is what pdf.js expects
    const uint8Array = new Uint8Array(buffer);
    
    // Create parser with data property (not url)
    const parser = new PDFParse({ data: uint8Array });
    
    // Extract text
    const result = await parser.getText();
    return result;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}
