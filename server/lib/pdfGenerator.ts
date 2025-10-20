// PDF generation utilities for combining multiple images into a single PDF
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

export interface PageBuffer {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Combines multiple image files into a single PDF document
 */
export async function combineImagesToPDF(pages: PageBuffer[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  for (const page of pages) {
    try {
      let imageBuffer = page.buffer;
      let embedFunction;

      // Convert all images to JPEG for consistency
      // IMPORTANT: Apply auto-rotation based on EXIF data to preserve orientation
      if (page.mimeType === 'image/png' || page.mimeType === 'image/webp') {
        imageBuffer = await sharp(page.buffer)
          .rotate() // Auto-rotate based on EXIF orientation
          .jpeg({ quality: 90 })
          .toBuffer();
        embedFunction = pdfDoc.embedJpg.bind(pdfDoc);
      } else if (page.mimeType === 'image/jpeg') {
        // Also rotate JPEG images based on EXIF
        imageBuffer = await sharp(page.buffer)
          .rotate() // Auto-rotate based on EXIF orientation
          .jpeg({ quality: 90 })
          .toBuffer();
        embedFunction = pdfDoc.embedJpg.bind(pdfDoc);
      } else if (page.mimeType === 'application/pdf') {
        // If it's already a PDF, merge it
        const existingPdfDoc = await PDFDocument.load(page.buffer);
        const copiedPages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
        copiedPages.forEach((copiedPage) => {
          pdfDoc.addPage(copiedPage);
        });
        continue;
      } else {
        throw new Error(`Unsupported file type: ${page.mimeType}`);
      }

      // Embed the image
      const image = await embedFunction(imageBuffer);
      const imageDims = image.scale(1);

      // Create a page with the same dimensions as the image
      const pdfPage = pdfDoc.addPage([imageDims.width, imageDims.height]);

      // Draw the image on the page
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: imageDims.width,
        height: imageDims.height,
      });
    } catch (error) {
      console.error('Error adding page to PDF:', error);
      throw new Error(`Failed to add page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Creates a thumbnail from the first page of a PDF
 */
export async function generatePdfThumbnail(pdfBuffer: Buffer): Promise<Buffer> {
  // Load the PDF
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  
  // Get the first page
  const pages = pdfDoc.getPages();
  if (pages.length === 0) {
    throw new Error('PDF has no pages');
  }

  // For now, we'll create a simple thumbnail placeholder
  // In production, you might want to use a library like pdf2pic or pdfjs-dist
  // For simplicity, we'll create a generic document thumbnail
  const thumbnail = await sharp({
    create: {
      width: 400,
      height: 300,
      channels: 3,
      background: { r: 240, g: 240, b: 240 }
    }
  })
    .jpeg({ quality: 80 })
    .toBuffer();

  return thumbnail;
}
