export interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  percentage: number;
  region?: string;
}

export interface ColorPalette {
  primary: ExtractedColor;
  secondary: ExtractedColor;
  background: ExtractedColor;
  text: ExtractedColor;
  accent: ExtractedColor;
  sidebar?: ExtractedColor;
  header?: ExtractedColor;
  allColors: ExtractedColor[];
  dominantBackground: ExtractedColor;
}

export interface RegionColors {
  header: ExtractedColor[];
  body: ExtractedColor[];
  accent: ExtractedColor[];
  sidebar: ExtractedColor[];
  main: ExtractedColor[];
}

interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

function getBrightness(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

// Color helper functions - kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isWhiteOrNearWhite(r: number, g: number, b: number, threshold: number = 240): boolean {
  return r > threshold && g > threshold && b > threshold;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isBlackOrNearBlack(r: number, g: number, b: number, threshold: number = 30): boolean {
  return r < threshold && g < threshold && b < threshold;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isGray(r: number, g: number, b: number, tolerance: number = 20): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min < tolerance;
}

function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) + 
    Math.pow(c1.g - c2.g, 2) + 
    Math.pow(c1.b - c2.b, 2)
  );
}

/**
 * Extract comprehensive color palette from image
 * Analyzes different regions to detect multi-color backgrounds (sidebar layouts, headers, etc.)
 */
export async function extractColorsFromImage(imageSrc: string): Promise<ColorPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const totalPixels = pixels.length / 4;
      
      // Analyze different regions of the image
      const regions = {
        full: { x: 0, y: 0, width: canvas.width, height: canvas.height },
        left: { x: 0, y: 0, width: Math.floor(canvas.width * 0.35), height: canvas.height },
        right: { x: Math.floor(canvas.width * 0.35), y: 0, width: Math.floor(canvas.width * 0.65), height: canvas.height },
        top: { x: 0, y: 0, width: canvas.width, height: Math.floor(canvas.height * 0.25) },
        bottom: { x: 0, y: Math.floor(canvas.height * 0.75), width: canvas.width, height: Math.floor(canvas.height * 0.25) },
        center: { x: Math.floor(canvas.width * 0.2), y: Math.floor(canvas.height * 0.2), width: Math.floor(canvas.width * 0.6), height: Math.floor(canvas.height * 0.6) },
      };
      
      // Extract colors from each region
      const regionColors: Record<string, ExtractedColor[]> = {};
      
      Object.entries(regions).forEach(([name, region]) => {
        regionColors[name] = extractColorsFromRegion(pixels, canvas.width, region, totalPixels);
      });
      
      // Combine all colors for full palette
      const allColors = regionColors.full;
      
      // Find dominant background color (usually the most common light color)
      const backgroundCandidates = allColors.filter(c => {
        const brightness = getBrightness(c.rgb.r, c.rgb.g, c.rgb.b);
        return brightness > 180;
      });
      
      const dominantBackground = backgroundCandidates[0] || { 
        hex: "#ffffff", 
        rgb: { r: 255, g: 255, b: 255 }, 
        percentage: 0 
      };
      
      // Detect if there's a sidebar layout by comparing left and right regions
      const leftColors = regionColors.left;
      const rightColors = regionColors.right;
      
      let sidebarColor: ExtractedColor | undefined;
      let mainColor: ExtractedColor | undefined;
      
      if (leftColors.length > 0 && rightColors.length > 0) {
        const leftDominant = leftColors[0];
        const rightDominant = rightColors[0];
        
        // If left and right have significantly different dominant colors, it's likely a sidebar layout
        const colorDiff = colorDistance(leftDominant.rgb, rightDominant.rgb);
        
        if (colorDiff > 30) {
          // Determine which is darker (usually sidebar)
          const leftBrightness = getBrightness(leftDominant.rgb.r, leftDominant.rgb.g, leftDominant.rgb.b);
          const rightBrightness = getBrightness(rightDominant.rgb.r, rightDominant.rgb.g, rightDominant.rgb.b);
          
          if (leftBrightness < rightBrightness) {
            sidebarColor = leftDominant;
            mainColor = rightDominant;
          } else {
            sidebarColor = rightDominant;
            mainColor = leftDominant;
          }
        }
      }
      
      // Find primary color (most common non-background color)
      const nonBackgroundColors = allColors.filter(c => {
        const brightness = getBrightness(c.rgb.r, c.rgb.g, c.rgb.b);
        return brightness < 200 && brightness > 50 && c.percentage > 1;
      });
      
      const primary = nonBackgroundColors[0] || { 
        hex: "#333333", 
        rgb: { r: 51, g: 51, b: 51 }, 
        percentage: 0 
      };
      
      // Secondary color (second most common non-background)
      const secondary = nonBackgroundColors[1] || { 
        hex: "#666666", 
        rgb: { r: 102, g: 102, b: 102 }, 
        percentage: 0 
      };
      
      // Accent color (vibrant color that's not background or primary)
      const accentCandidates = allColors.filter(c => {
        const brightness = getBrightness(c.rgb.r, c.rgb.g, c.rgb.b);
        const saturation = Math.max(c.rgb.r, c.rgb.g, c.rgb.b) - Math.min(c.rgb.r, c.rgb.g, c.rgb.b);
        return saturation > 50 && brightness > 80 && brightness < 200 && c.percentage > 0.5;
      });
      
      const accent = accentCandidates[0] || { 
        hex: "#0066cc", 
        rgb: { r: 0, g: 102, b: 204 }, 
        percentage: 0 
      };
      
      // Text color (darkest common color)
      const darkColors = allColors.filter(c => {
        const brightness = getBrightness(c.rgb.r, c.rgb.g, c.rgb.b);
        return brightness < 100;
      });
      
      const text = darkColors[0] || { 
        hex: "#333333", 
        rgb: { r: 51, g: 51, b: 51 }, 
        percentage: 0 
      };
      
      resolve({
        primary,
        secondary,
        background: mainColor || dominantBackground,
        text,
        accent,
        sidebar: sidebarColor,
        header: regionColors.top[0]?.percentage > 10 ? regionColors.top[0] : undefined,
        allColors: allColors.slice(0, 20),
        dominantBackground,
      });
    };
    
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageSrc;
  });
}

/**
 * Extract colors from a specific region
 */
function extractColorsFromRegion(
  pixels: Uint8ClampedArray, 
  imageWidth: number, 
  region: { x: number; y: number; width: number; height: number },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  totalImagePixels: number
): ExtractedColor[] {
  const colorMap = new Map<string, { rgb: { r: number; g: number; b: number }; count: number }>();
  let regionPixelCount = 0;
  
  for (let y = region.y; y < Math.min(region.y + region.height, pixels.length / 4 / imageWidth); y++) {
    for (let x = region.x; x < Math.min(region.x + region.width, imageWidth); x++) {
      const idx = (y * imageWidth + x) * 4;
      
      const r = Math.round(pixels[idx] / 8) * 8;
      const g = Math.round(pixels[idx + 1] / 8) * 8;
      const b = Math.round(pixels[idx + 2] / 8) * 8;
      
      // Skip near-white and near-black for non-background detection
      // but still count them
      const key = `${r},${g},${b}`;
      const existing = colorMap.get(key);
      
      if (existing) {
        existing.count++;
      } else {
        colorMap.set(key, { rgb: { r, g, b }, count: 1 });
      }
      
      regionPixelCount++;
    }
  }
  
  const colors: ExtractedColor[] = [];
  colorMap.forEach((data) => {
    colors.push({
      hex: rgbToHex(data.rgb.r, data.rgb.g, data.rgb.b),
      rgb: data.rgb,
      percentage: (data.count / regionPixelCount) * 100,
    });
  });
  
  colors.sort((a, b) => b.percentage - a.percentage);
  return colors;
}

/**
 * Extract colors from specific regions with bounding boxes
 */
export async function extractRegionColors(
  imageSrc: string,
  regions: { bbox: BoundingBox; type: "header" | "body" | "accent" | "sidebar" | "main" }[]
): Promise<RegionColors> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const result: RegionColors = {
        header: [],
        body: [],
        accent: [],
        sidebar: [],
        main: [],
      };
      
      regions.forEach(({ bbox, type }) => {
        const x = Math.max(0, Math.floor(bbox.x0));
        const y = Math.max(0, Math.floor(bbox.y0));
        const width = Math.min(canvas.width - x, Math.ceil(bbox.x1 - bbox.x0));
        const height = Math.min(canvas.height - y, Math.ceil(bbox.y1 - bbox.y0));
        
        if (width <= 0 || height <= 0) return;
        
        const regionData = ctx.getImageData(x, y, width, height);
        const pixels = regionData.data;
        
        const colorMap = new Map<string, { rgb: { r: number; g: number; b: number }; count: number }>();
        let totalCount = 0;
        
        for (let i = 0; i < pixels.length; i += 4) {
          const r = Math.round(pixels[i] / 16) * 16;
          const g = Math.round(pixels[i + 1] / 16) * 16;
          const b = Math.round(pixels[i + 2] / 16) * 16;
          
          const key = `${r},${g},${b}`;
          const existing = colorMap.get(key);
          
          if (existing) {
            existing.count++;
          } else {
            colorMap.set(key, { rgb: { r, g, b }, count: 1 });
          }
          totalCount++;
        }
        
        const regionColors: ExtractedColor[] = [];
        
        colorMap.forEach((data) => {
          regionColors.push({
            hex: rgbToHex(data.rgb.r, data.rgb.g, data.rgb.b),
            rgb: data.rgb,
            percentage: (data.count / totalCount) * 100,
          });
        });
        
        regionColors.sort((a, b) => b.percentage - a.percentage);
        result[type] = regionColors.slice(0, 5);
      });
      
      resolve(result);
    };
    
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageSrc;
  });
}

/**
 * Detect contrast color (black or white) that works best on given background
 */
export function detectContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  const brightness = getBrightness(r, g, b);
  
  return brightness > 128 ? "#1a1a1a" : "#ffffff";
}

/**
 * Check if color palette suggests a sidebar layout
 */
export function detectSidebarLayout(palette: ColorPalette): boolean {
  return !!palette.sidebar && palette.sidebar.percentage > 5;
}

/**
 * Get the best background color for a specific region
 */
export function getBackgroundColorForRegion(
  palette: ColorPalette, 
  region: 'sidebar' | 'main' | 'header' | 'default'
): string {
  switch (region) {
    case 'sidebar':
      return palette.sidebar?.hex || palette.secondary.hex;
    case 'header':
      return palette.header?.hex || palette.primary.hex;
    case 'main':
    case 'default':
    default:
      return palette.background.hex;
  }
}

export const ColorExtractor = {
  extractColorsFromImage,
  extractRegionColors,
  detectContrastColor,
  detectSidebarLayout,
  getBackgroundColorForRegion,
};

export default ColorExtractor;
