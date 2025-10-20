import gm from 'gm';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const imageMagick = gm.subClass({ imageMagick: true });

export interface PDFPageImage {
  base64: string;
  mimeType: string;
  pageNumber: number;
}

/**
 * Converts a PDF buffer to an array of PNG images (one per page)
 * Uses GraphicsMagick/ImageMagick for reliable PDF rendering
 */
export async function convertPdfToImages(pdfBuffer: Buffer): Promise<PDFPageImage[]> {
  const tempPdfPath = join(tmpdir(), `pdf-${Date.now()}.pdf`);
  
  try {
    console.log('Converting PDF to images using GraphicsMagick...');
    
    // Write PDF to temp file
    await writeFile(tempPdfPath, pdfBuffer);
    
    // Get number of pages
    const img = imageMagick(tempPdfPath);
    const identifyAsync = promisify(img.identify.bind(img));
    const info: any = await identifyAsync();
    const pageNumbers = info.toString().trim().split('\n').filter((p: string) => p.trim());
    const numPages = pageNumbers.length;
    
    console.log(`PDF has ${numPages} page(s)`);
    
    const images: PDFPageImage[] = [];
    
    // Convert each page
    for (let pageNum = 0; pageNum < numPages; pageNum++) {
      const pageImg = imageMagick(tempPdfPath + `[${pageNum}]`)
        .density(150, 150)
        .quality(90);
      
      const toBufferAsync = promisify(pageImg.toBuffer.bind(pageImg));
      const imageBuffer = await toBufferAsync() as Buffer;
      const base64Image = imageBuffer.toString('base64');
      
      images.push({
        base64: base64Image,
        mimeType: 'image/png',
        pageNumber: pageNum + 1,
      });
      
      console.log(`  ✓ Converted page ${pageNum + 1}/${numPages}`);
    }
    
    console.log(`Successfully converted ${images.length} page(s) to images`);
    return images;
  } catch (error) {
    console.error('Failed to convert PDF to images:', error);
    throw new Error('PDF to image conversion failed: ' + (error as Error).message);
  } finally {
    // Clean up temp file
    try {
      await unlink(tempPdfPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}
