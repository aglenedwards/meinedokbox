import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readdir, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

export interface PDFPageImage {
  base64: string;
  mimeType: string;
  pageNumber: number;
}

/**
 * Converts a PDF buffer to an array of PNG images (one per page)
 * Uses pdftoppm from poppler-utils for reliable PDF rendering
 */
export async function convertPdfToImages(pdfBuffer: Buffer): Promise<PDFPageImage[]> {
  const tempPdfPath = join(tmpdir(), `pdf-${Date.now()}.pdf`);
  const outputPrefix = join(tmpdir(), `pdf-page-${Date.now()}`);
  
  try {
    console.log('Converting PDF to images using pdftoppm...');
    
    // Write PDF to temp file
    await writeFile(tempPdfPath, pdfBuffer);
    
    // Convert PDF to PNG images using pdftoppm
    // -png: output format
    // -r 150: resolution (DPI)
    await execAsync(`pdftoppm -png -r 150 "${tempPdfPath}" "${outputPrefix}"`);
    
    // Find all generated PNG files
    const tempDir = tmpdir();
    const allFiles = await readdir(tempDir);
    const pngFiles = allFiles
      .filter(f => f.startsWith(join(outputPrefix).split('/').pop() || '') && f.endsWith('.png'))
      .sort();
    
    console.log(`PDF converted to ${pngFiles.length} page(s)`);
    
    const images: PDFPageImage[] = [];
    
    // Read each generated PNG file
    for (let i = 0; i < pngFiles.length; i++) {
      const pngPath = join(tempDir, pngFiles[i]);
      const imageBuffer = await readFile(pngPath);
      const base64Image = imageBuffer.toString('base64');
      
      images.push({
        base64: base64Image,
        mimeType: 'image/png',
        pageNumber: i + 1,
      });
      
      // Clean up PNG file
      await unlink(pngPath).catch(() => {});
      
      console.log(`  ✓ Converted page ${i + 1}/${pngFiles.length}`);
    }
    
    console.log(`Successfully converted ${images.length} page(s) to images`);
    return images;
  } catch (error) {
    console.error('Failed to convert PDF to images:', error);
    throw new Error('PDF to image conversion failed: ' + (error as Error).message);
  } finally {
    // Clean up temp PDF file
    await unlink(tempPdfPath).catch(() => {});
  }
}
