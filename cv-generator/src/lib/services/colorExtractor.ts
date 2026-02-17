export interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  percentage: number;
}

export interface ColorPalette {
  primary: ExtractedColor;
  secondary: ExtractedColor;
  background: ExtractedColor;
  text: ExtractedColor;
  accent: ExtractedColor;
  allColors: ExtractedColor[];
}

export interface RegionColors {
  header: ExtractedColor[];
  body: ExtractedColor[];
  accent: ExtractedColor[];
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

function isWhiteOrBlack(r: number, g: number, b: number): boolean {
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 240 || brightness < 15;
}

function isGray(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min < 30;
}

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
      
      const colorMap = new Map<string, number>();
      const totalPixels = pixels.length / 4;
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = Math.round(pixels[i] / 8) * 8;
        const g = Math.round(pixels[i + 1] / 8) * 8;
        const b = Math.round(pixels[i + 2] / 8) * 8;
        
        if (isWhiteOrBlack(r, g, b) || isGray(r, g, b)) {
          continue;
        }
        
        const key = `${r},${g},${b}`;
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
      }
      
      const sortedColors: ExtractedColor[] = [];
      colorMap.forEach((count, key) => {
        const [r, g, b] = key.split(",").map(Number);
        sortedColors.push({
          hex: rgbToHex(r, g, b),
          rgb: { r, g, b },
          percentage: (count / totalPixels) * 100,
        });
      });
      
      sortedColors.sort((a, b) => b.percentage - a.percentage);
      
      const nonWhitePixels = sortedColors.filter(c => c.percentage > 0.5);
      
      const primary = nonWhitePixels[0] || { hex: "#333333", rgb: { r: 51, g: 51, b: 51 }, percentage: 0 };
      const secondary = nonWhitePixels[1] || { hex: "#666666", rgb: { r: 102, g: 102, b: 102 }, percentage: 0 };
      const accent = nonWhitePixels[2] || { hex: "#0066cc", rgb: { r: 0, g: 102, b: 204 }, percentage: 0 };
      
      let background = { hex: "#ffffff", rgb: { r: 255, g: 255, b: 255 }, percentage: 0 };
      let text = { hex: "#333333", rgb: { r: 51, g: 51, b: 51 }, percentage: 0 };
      
      let maxWhite = 0;
      let maxDark = 0;
      
      colorMap.forEach((count, key) => {
        const [r, g, b] = key.split(",").map(Number);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        if (brightness > 240) {
          if (count > maxWhite) {
            maxWhite = count;
            background = { hex: rgbToHex(r, g, b), rgb: { r, g, b }, percentage: (count / totalPixels) * 100 };
          }
        } else if (brightness < 80) {
          if (count > maxDark) {
            maxDark = count;
            text = { hex: rgbToHex(r, g, b), rgb: { r, g, b }, percentage: (count / totalPixels) * 100 };
          }
        }
      });
      
      resolve({
        primary,
        secondary,
        background,
        text,
        accent,
        allColors: sortedColors.slice(0, 20),
      });
    };
    
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageSrc;
  });
}

export async function extractRegionColors(
  imageSrc: string,
  regions: { bbox: BoundingBox; type: "header" | "body" | "accent" }[]
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
      };
      
      regions.forEach(({ bbox, type }) => {
        const x = Math.max(0, Math.floor(bbox.x0));
        const y = Math.max(0, Math.floor(bbox.y0));
        const width = Math.min(canvas.width - x, Math.ceil(bbox.x1 - bbox.x0));
        const height = Math.min(canvas.height - y, Math.ceil(bbox.y1 - bbox.y0));
        
        if (width <= 0 || height <= 0) return;
        
        const regionData = ctx.getImageData(x, y, width, height);
        const pixels = regionData.data;
        
        const colorMap = new Map<string, number>();
        
        for (let i = 0; i < pixels.length; i += 4) {
          const r = Math.round(pixels[i] / 16) * 16;
          const g = Math.round(pixels[i + 1] / 16) * 16;
          const b = Math.round(pixels[i + 2] / 16) * 16;
          
          if (isWhiteOrBlack(r, g, b)) continue;
          
          const key = `${r},${g},${b}`;
          colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }
        
        const regionColors: ExtractedColor[] = [];
        let totalCount = 0;
        colorMap.forEach((count) => { totalCount += count; });
        
        colorMap.forEach((count, key) => {
          const [r, g, b] = key.split(",").map(Number);
          regionColors.push({
            hex: rgbToHex(r, g, b),
            rgb: { r, g, b },
            percentage: (count / totalCount) * 100,
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

export function detectContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  return brightness > 128 ? "#333333" : "#ffffff";
}

export const ColorExtractor = {
  extractColorsFromImage,
  extractRegionColors,
  detectContrastColor,
};

export default ColorExtractor;
