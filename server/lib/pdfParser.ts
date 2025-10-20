export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for ESM compatibility
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({});
    await parser.load(buffer);
    const text = await parser.getText();
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}
