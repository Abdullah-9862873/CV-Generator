export interface ComparisonResult {
  similarityScore: number; // 0-100
  pixelDifference: number;
  totalPixels: number;
  matchPercentage: number;
  differences: DifferenceRegion[];
  analysis: {
    colorAccuracy: number;
    layoutAccuracy: number;
    textAccuracy: number;
    overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export interface DifferenceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'color' | 'missing' | 'extra' | 'position';
  severity: 'low' | 'medium' | 'high';
}

export interface ComparisonOptions {
  tolerance?: number; // Color difference tolerance (0-255)
  ignoreRegions?: { x: number; y: number; width: number; height: number }[];
  highlightDifferences?: boolean;
  downsampleFactor?: number; // For performance (1 = full resolution)
}

const DEFAULT_OPTIONS: ComparisonOptions = {
  tolerance: 15,
  highlightDifferences: true,
  downsampleFactor: 2, // Compare at 50% resolution for performance
};

/**
 * Compare two images pixel-by-pixel and return similarity metrics
 */
export async function compareImages(
  originalImage: string | HTMLImageElement,
  generatedImage: string | HTMLImageElement,
  options: ComparisonOptions = {}
): Promise<ComparisonResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [originalCanvas, generatedCanvas] = await Promise.all([
    loadImageToCanvas(originalImage),
    loadImageToCanvas(generatedImage),
  ]);

  // Normalize sizes - scale both to the same dimensions
  const maxWidth = Math.max(originalCanvas.width, generatedCanvas.width);
  const maxHeight = Math.max(originalCanvas.height, generatedCanvas.height);
  
  const normalizedOriginal = normalizeCanvas(originalCanvas, maxWidth, maxHeight);
  const normalizedGenerated = normalizeCanvas(generatedCanvas, maxWidth, maxHeight);

  // Downsample for performance if needed
  const downsampleWidth = Math.floor(maxWidth / (opts.downsampleFactor || 1));
  const downsampleHeight = Math.floor(maxHeight / (opts.downsampleFactor || 1));
  
  const compareOriginal = resizeCanvas(normalizedOriginal, downsampleWidth, downsampleHeight);
  const compareGenerated = resizeCanvas(normalizedGenerated, downsampleWidth, downsampleHeight);

  const originalData = compareOriginal.getContext('2d')!.getImageData(0, 0, downsampleWidth, downsampleHeight);
  const generatedData = compareGenerated.getContext('2d')!.getImageData(0, 0, downsampleWidth, downsampleHeight);

  let matchingPixels = 0;
  let totalPixels = 0;
  const differences: DifferenceRegion[] = [];
  
  const pixels = originalData.data;
  const genPixels = generatedData.data;
  
  // Track contiguous difference regions
  let currentDiffRegion: { startX: number; startY: number; width: number; height: number } | null = null;
  
  for (let y = 0; y < downsampleHeight; y++) {
    for (let x = 0; x < downsampleWidth; x++) {
      const idx = (y * downsampleWidth + x) * 4;
      
      const r1 = pixels[idx];
      const g1 = pixels[idx + 1];
      const b1 = pixels[idx + 2];
      const a1 = pixels[idx + 3];
      
      const r2 = genPixels[idx];
      const g2 = genPixels[idx + 1];
      const b2 = genPixels[idx + 2];
      const a2 = genPixels[idx + 3];
      
      // Skip transparent pixels in both
      if (a1 < 10 && a2 < 10) continue;
      
      totalPixels++;
      
      // Calculate color distance
      const colorDiff = Math.sqrt(
        Math.pow(r1 - r2, 2) + 
        Math.pow(g1 - g2, 2) + 
        Math.pow(b1 - b2, 2)
      );
      
      if (colorDiff <= (opts.tolerance || 15)) {
        matchingPixels++;
        
        // End current difference region if exists
        if (currentDiffRegion) {
          differences.push(createDifferenceRegion(currentDiffRegion, downsampleWidth, downsampleHeight, 'color'));
          currentDiffRegion = null;
        }
      } else {
        // Track difference region
        if (!currentDiffRegion) {
          currentDiffRegion = { startX: x, startY: y, width: 1, height: 1 };
        } else {
          currentDiffRegion.width = Math.max(currentDiffRegion.width, x - currentDiffRegion.startX + 1);
          currentDiffRegion.height = Math.max(currentDiffRegion.height, y - currentDiffRegion.startY + 1);
        }
      }
    }
    
    // End row, close current region
    if (currentDiffRegion) {
      differences.push(createDifferenceRegion(currentDiffRegion, downsampleWidth, downsampleHeight, 'color'));
      currentDiffRegion = null;
    }
  }

  // Calculate metrics
  const pixelDifference = totalPixels - matchingPixels;
  const matchPercentage = totalPixels > 0 ? (matchingPixels / totalPixels) * 100 : 0;
  const similarityScore = calculateSimilarityScore(matchPercentage, differences.length, totalPixels);

  // Analyze different aspects
  const colorAccuracy = calculateColorAccuracy(pixels, genPixels, totalPixels);
  const layoutAccuracy = calculateLayoutAccuracy(differences, totalPixels);

  return {
    similarityScore,
    pixelDifference,
    totalPixels,
    matchPercentage,
    differences: differences.slice(0, 50), // Limit to top 50 differences
    analysis: {
      colorAccuracy,
      layoutAccuracy,
      textAccuracy: 0, // Would need OCR comparison
      overallQuality: getQualityLevel(similarityScore),
    },
  };
}

/**
 * Generate a visual diff image highlighting differences
 */
export async function generateDiffImage(
  originalImage: string | HTMLImageElement,
  generatedImage: string | HTMLImageElement,
  options: ComparisonOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [originalCanvas, generatedCanvas] = await Promise.all([
    loadImageToCanvas(originalImage),
    loadImageToCanvas(generatedImage),
  ]);

  const maxWidth = Math.max(originalCanvas.width, generatedCanvas.width);
  const maxHeight = Math.max(originalCanvas.height, generatedCanvas.height);
  
  const normalizedOriginal = normalizeCanvas(originalCanvas, maxWidth, maxHeight);
  const normalizedGenerated = normalizeCanvas(generatedCanvas, maxWidth, maxHeight);

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = maxWidth;
  diffCanvas.height = maxHeight;
  const ctx = diffCanvas.getContext('2d')!;

  const originalData = normalizedOriginal.getContext('2d')!.getImageData(0, 0, maxWidth, maxHeight);
  const generatedData = normalizedGenerated.getContext('2d')!.getImageData(0, 0, maxWidth, maxHeight);
  const diffData = ctx.createImageData(maxWidth, maxHeight);

  const pixels = originalData.data;
  const genPixels = generatedData.data;
  const diffPixels = diffData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const r1 = pixels[i];
    const g1 = pixels[i + 1];
    const b1 = pixels[i + 2];
    const a1 = pixels[i + 3];
    
    const r2 = genPixels[i];
    const g2 = genPixels[i + 1];
    const b2 = genPixels[i + 2];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const a2 = genPixels[i + 3];
    
    const colorDiff = Math.sqrt(
      Math.pow(r1 - r2, 2) + 
      Math.pow(g1 - g2, 2) + 
      Math.pow(b1 - b2, 2)
    );
    
    if (colorDiff <= (opts.tolerance || 15)) {
      // Matching pixel - show slightly dimmed
      diffPixels[i] = Math.floor(r1 * 0.7);
      diffPixels[i + 1] = Math.floor(g1 * 0.7);
      diffPixels[i + 2] = Math.floor(b1 * 0.7);
      diffPixels[i + 3] = a1;
    } else {
      // Different pixel - highlight in red
      diffPixels[i] = 255;
      diffPixels[i + 1] = 50;
      diffPixels[i + 2] = 50;
      diffPixels[i + 3] = 200;
    }
  }

  ctx.putImageData(diffData, 0, 0);
  return diffCanvas.toDataURL('image/png');
}

/**
 * Generate side-by-side comparison image
 */
export async function generateSideBySideComparison(
  originalImage: string | HTMLImageElement,
  generatedImage: string | HTMLImageElement,
  labels: { original?: string; generated?: string } = {}
): Promise<string> {
  const [origCanvas, genCanvas] = await Promise.all([
    loadImageToCanvas(originalImage),
    loadImageToCanvas(generatedImage),
  ]);

  const padding = 40;
  const labelHeight = 30;
  const gap = 20;
  
  const maxHeight = Math.max(origCanvas.height, genCanvas.height);
  const totalWidth = origCanvas.width + genCanvas.width + gap + (padding * 2);
  const totalHeight = maxHeight + labelHeight + (padding * 2);

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Labels
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  
  ctx.fillText(labels.original || 'Original CV', padding + origCanvas.width / 2, padding + 20);
  ctx.fillText(labels.generated || 'Generated Replica', padding + origCanvas.width + gap + genCanvas.width / 2, padding + 20);

  // Draw images
  ctx.drawImage(origCanvas, padding, padding + labelHeight);
  ctx.drawImage(genCanvas, padding + origCanvas.width + gap, padding + labelHeight);

  // Draw border
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 2;
  ctx.strokeRect(padding - 2, padding + labelHeight - 2, origCanvas.width + 4, origCanvas.height + 4);
  ctx.strokeRect(padding + origCanvas.width + gap - 2, padding + labelHeight - 2, genCanvas.width + 4, genCanvas.height + 4);

  return canvas.toDataURL('image/png');
}

// Helper functions
async function loadImageToCanvas(src: string | HTMLImageElement): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = typeof src === 'string' ? new Image() : src;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    if (typeof src === 'string') {
      img.crossOrigin = 'anonymous';
      img.src = src;
    } else {
      // If already an image element
      if (img.complete) {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      }
    }
  });
}

function normalizeCanvas(canvas: HTMLCanvasElement, targetWidth: number, targetHeight: number): HTMLCanvasElement {
  const normalized = document.createElement('canvas');
  normalized.width = targetWidth;
  normalized.height = targetHeight;
  const ctx = normalized.getContext('2d')!;
  
  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  
  // Center the original image
  const x = (targetWidth - canvas.width) / 2;
  const y = (targetHeight - canvas.height) / 2;
  ctx.drawImage(canvas, Math.max(0, x), Math.max(0, y));
  
  return normalized;
}

function resizeCanvas(canvas: HTMLCanvasElement, targetWidth: number, targetHeight: number): HTMLCanvasElement {
  const resized = document.createElement('canvas');
  resized.width = targetWidth;
  resized.height = targetHeight;
  const ctx = resized.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
  return resized;
}

function createDifferenceRegion(
  region: { startX: number; startY: number; width: number; height: number },
  totalWidth: number,
  totalHeight: number,
  type: DifferenceRegion['type']
): DifferenceRegion {
  const area = region.width * region.height;
  const totalArea = totalWidth * totalHeight;
  const severity: DifferenceRegion['severity'] = 
    area / totalArea > 0.1 ? 'high' : area / totalArea > 0.01 ? 'medium' : 'low';
  
  return {
    x: region.startX,
    y: region.startY,
    width: region.width,
    height: region.height,
    type,
    severity,
  };
}

function calculateSimilarityScore(matchPercentage: number, diffCount: number, // eslint-disable-next-line @typescript-eslint/no-unused-vars
totalPixels: number): number {
  // Base score from pixel matching
  let score = matchPercentage;
  
  // Penalize for number of difference regions
  const diffPenalty = Math.min(diffCount * 0.5, 20);
  score -= diffPenalty;
  
  // Boost for very high match rates
  if (matchPercentage > 95) score += 5;
  if (matchPercentage > 98) score += 3;
  
  return Math.max(0, Math.min(100, score));
}

function calculateColorAccuracy(pixels1: Uint8ClampedArray, pixels2: Uint8ClampedArray, // eslint-disable-next-line @typescript-eslint/no-unused-vars
totalPixels: number): number {
  let totalDiff = 0;
  let comparedPixels = 0;
  
  for (let i = 0; i < pixels1.length; i += 4) {
    const a1 = pixels1[i + 3];
    const a2 = pixels2[i + 3];
    
    if (a1 < 10 && a2 < 10) continue;
    
    comparedPixels++;
    const diff = Math.sqrt(
      Math.pow(pixels1[i] - pixels2[i], 2) +
      Math.pow(pixels1[i + 1] - pixels2[i + 1], 2) +
      Math.pow(pixels1[i + 2] - pixels2[i + 2], 2)
    );
    totalDiff += diff;
  }
  
  const avgDiff = comparedPixels > 0 ? totalDiff / comparedPixels : 0;
  return Math.max(0, 100 - (avgDiff / 4.42)); // 4.42 is max possible diff per channel on average
}

function calculateLayoutAccuracy(differences: DifferenceRegion[], totalPixels: number): number {
  if (differences.length === 0) return 100;
  
  const totalDiffArea = differences.reduce((sum, d) => sum + (d.width * d.height), 0);
  return Math.max(0, 100 - (totalDiffArea / totalPixels) * 100);
}

function getQualityLevel(score: number): ComparisonResult['analysis']['overallQuality'] {
  if (score >= 95) return 'excellent';
  if (score >= 85) return 'good';
  if (score >= 70) return 'fair';
  return 'poor';
}

export const VisualComparison = {
  compareImages,
  generateDiffImage,
  generateSideBySideComparison,
};

export default VisualComparison;
