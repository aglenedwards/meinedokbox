import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';

export interface PDFPageImage {
  base64: string;
  mimeType: string;
  pageNumber: number;
}

/**
 * Converts a PDF buffer to an array of PNG images (one per page)
 */
export async function convertPdfToImages(pdfBuffer: Buffer): Promise<PDFPageImage[]> {
  try {
    console.log('Converting PDF to images...');
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
    });
    
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    console.log(`PDF has ${numPages} page(s)`);
    
    const images: PDFPageImage[] = [];
    
    // Convert each page to an image
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      
      // Get viewport at 2x scale for better quality
      const viewport = page.getViewport({ scale: 2.0 });
      
      // Create canvas
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      
      // Render PDF page to canvas
      await page.render({
        canvasContext: context as any,
        viewport: viewport,
        canvas: canvas as any,
      }).promise;
      
      // Convert canvas to base64 PNG
      const base64Image = canvas.toDataURL('image/png').split(',')[1];
      
      images.push({
        base64: base64Image,
        mimeType: 'image/png',
        pageNumber: pageNum,
      });
      
      console.log(`  ✓ Converted page ${pageNum}/${numPages}`);
    }
    
    console.log(`Successfully converted ${images.length} page(s) to images`);
    return images;
  } catch (error) {
    console.error('Failed to convert PDF to images:', error);
    throw new Error('PDF to image conversion failed: ' + (error as Error).message);
  }
}
