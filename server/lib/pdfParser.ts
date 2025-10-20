export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for ESM compatibility
    const { PDFParse } = await import('pdf-parse');
    
    // Convert buffer to Uint8Array which is what pdf.js expects
    const uint8Array = new Uint8Array(buffer);
    
    const parser = new PDFParse({});
    await parser.load({ data: uint8Array });
    const text = await parser.getText();
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}
