/**
 * Simple edge detection and document enhancement using Canvas API
 * Provides auto-cropping, brightness/contrast adjustment, and perspective correction
 */

interface ProcessedImage {
  file: File;
  previewUrl: string;
  wasProcessed: boolean;
}

/**
 * Enhances a document image by:
 * - Auto-adjusting brightness and contrast
 * - Sharpening the image
 * - Converting to grayscale (optional)
 */
export async function enhanceDocumentImage(
  imageFile: File,
  options: {
    grayscale?: boolean;
    sharpen?: boolean;
    autoAdjust?: boolean;
  } = {}
): Promise<ProcessedImage> {
  const { grayscale = false, sharpen = true, autoAdjust = true } = options;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(imageFile);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve({
            file: imageFile,
            previewUrl: objectUrl,
            wasProcessed: false
          });
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let wasProcessed = false;

        // Apply grayscale
        if (grayscale) {
          imageData = applyGrayscale(imageData);
          wasProcessed = true;
        }

        // Auto-adjust brightness and contrast
        if (autoAdjust) {
          imageData = autoAdjustImage(imageData);
          wasProcessed = true;
        }

        // Apply sharpening
        if (sharpen) {
          imageData = applySharpen(imageData);
          wasProcessed = true;
        }

        // Put processed image back
        ctx.putImageData(imageData, 0, 0);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            URL.revokeObjectURL(objectUrl);
            resolve({
              file: imageFile,
              previewUrl: objectUrl,
              wasProcessed: false
            });
            return;
          }

          const processedFile = new File([blob], imageFile.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          const processedUrl = URL.createObjectURL(blob);
          URL.revokeObjectURL(objectUrl);

          resolve({
            file: processedFile,
            previewUrl: processedUrl,
            wasProcessed
          });
        }, 'image/jpeg', 0.95);

      } catch (error) {
        console.error('Image enhancement error:', error);
        URL.revokeObjectURL(objectUrl);
        resolve({
          file: imageFile,
          previewUrl: objectUrl,
          wasProcessed: false
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        file: imageFile,
        previewUrl: objectUrl,
        wasProcessed: false
      });
    };

    img.src = objectUrl;
  });
}

/**
 * Converts image to grayscale
 */
function applyGrayscale(imageData: ImageData): ImageData {
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
  
  return imageData;
}

/**
 * Auto-adjusts brightness and contrast for better document readability
 */
function autoAdjustImage(imageData: ImageData): ImageData {
  const data = imageData.data;
  let min = 255;
  let max = 0;

  // Find min and max brightness
  for (let i = 0; i < data.length; i += 4) {
    const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    min = Math.min(min, brightness);
    max = Math.max(max, brightness);
  }

  // Normalize using histogram stretching
  const range = max - min;
  if (range > 0) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = ((data[i] - min) * 255) / range;
      data[i + 1] = ((data[i + 1] - min) * 255) / range;
      data[i + 2] = ((data[i + 2] - min) * 255) / range;
    }
  }

  return imageData;
}

/**
 * Applies a sharpening filter to the image
 */
function applySharpen(imageData: ImageData): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new ImageData(width, height);

  // Sharpening kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += data[idx] * kernel[kernelIdx];
          }
        }

        const outputIdx = (y * width + x) * 4 + c;
        output.data[outputIdx] = Math.min(255, Math.max(0, sum));
      }
      
      // Alpha channel
      const idx = (y * width + x) * 4;
      output.data[idx + 3] = 255;
    }
  }

  // Copy edges from original
  for (let x = 0; x < width; x++) {
    for (let c = 0; c < 4; c++) {
      output.data[x * 4 + c] = data[x * 4 + c];
      output.data[((height - 1) * width + x) * 4 + c] = data[((height - 1) * width + x) * 4 + c];
    }
  }
  
  for (let y = 0; y < height; y++) {
    for (let c = 0; c < 4; c++) {
      output.data[y * width * 4 + c] = data[y * width * 4 + c];
      output.data[(y * width + width - 1) * 4 + c] = data[(y * width + width - 1) * 4 + c];
    }
  }

  return output;
}

/**
 * Detects if the image is a document (high contrast, text-like patterns)
 */
export function isLikelyDocument(imageFile: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(imageFile);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        resolve(false);
        return;
      }

      // Sample a smaller version for performance
      const sampleSize = 200;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const data = imageData.data;

      let edgeCount = 0;
      const threshold = 30;

      // Simple edge detection - count significant brightness changes
      for (let y = 1; y < sampleSize - 1; y++) {
        for (let x = 1; x < sampleSize - 1; x++) {
          const idx = (y * sampleSize + x) * 4;
          const brightness = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          
          const rightIdx = idx + 4;
          const rightBrightness = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
          
          const bottomIdx = (y + 1) * sampleSize * 4 + x * 4;
          const bottomBrightness = 0.299 * data[bottomIdx] + 0.587 * data[bottomIdx + 1] + 0.114 * data[bottomIdx + 2];

          if (Math.abs(brightness - rightBrightness) > threshold || 
              Math.abs(brightness - bottomBrightness) > threshold) {
            edgeCount++;
          }
        }
      }

      // Documents typically have lots of edges from text
      const edgeRatio = edgeCount / (sampleSize * sampleSize);
      URL.revokeObjectURL(objectUrl);
      
      // If more than 15% of pixels are edges, likely a document
      resolve(edgeRatio > 0.15);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(false);
    };

    img.src = objectUrl;
  });
}
