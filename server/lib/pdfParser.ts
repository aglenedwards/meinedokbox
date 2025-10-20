export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for ESM compatibility
    const { PDFParse } = await import('pdf-parse');
    const data = await PDFParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}
