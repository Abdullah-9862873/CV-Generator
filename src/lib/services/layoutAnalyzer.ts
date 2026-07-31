import { OCRResult } from "@/types";

export interface LayoutSection {
  id: string;
  type: "header" | "experience" | "education" | "skills" | "projects" | "certifications" | "languages" | "summary" | "contact" | "other";
  title: string;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  confidence: number;
}

export interface LayoutAnalysis {
  columns: number;
  columnWidths: number[];
  sections: LayoutSection[];
  fontSizes: {
    heading: number;
    subheading: number;
    body: number;
    small: number;
  };
  layout: "single" | "double" | "complex";
  pageWidth: number;
  pageHeight: number;
  lineHeight: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  blocks: LayoutBlock[];
}

export interface LayoutBlock {
  id: string;
  text: string;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  fontSize: number;
  fontWeight: number;
  isHeading: boolean;
  sectionId?: string;
  sectionType?: LayoutSection["type"];
}

interface WordPosition {
  text: string;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  confidence: number;
}

interface TextLine {
  text: string;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  y: number;
  isHeading: boolean;
  headingLevel: number;
}

const HEADER_KEYWORDS = [
  "summary", "objective", "profile", "about",
  "experience", "employment", "work", "career",
  "education", "academic", "degree", "university", "college", "school",
  "skills", "competencies", "expertise", "technologies",
  "projects", "portfolio",
  "certifications", "certificates", "licenses",
  "languages", "spoken",
  "contact", "info", "details",
  "awards", "honors", "achievements",
  "publications", "presentations",
  "volunteer", "interests", "references"
];

function groupWordsIntoLines(words: WordPosition[], tolerance: number = 5): TextLine[] {
  if (words.length === 0) return [];
  
  const lines: TextLine[] = [];
  const sortedByY = [...words].sort((a, b) => a.bbox.y0 - b.bbox.y0);
  
  let currentLine: WordPosition[] = [];
  let currentY = sortedByY[0].bbox.y0;
  
  sortedByY.forEach((word) => {
    if (Math.abs(word.bbox.y0 - currentY) <= tolerance) {
      currentLine.push(word);
    } else {
      if (currentLine.length > 0) {
        const sortedLine = currentLine.sort((a, b) => a.bbox.x0 - b.bbox.x0);
        const lineText = sortedLine.map(w => w.text).join(" ");
        const minX = Math.min(...sortedLine.map(w => w.bbox.x0));
        const maxX = Math.max(...sortedLine.map(w => w.bbox.x1));
        const avgY = sortedLine.reduce((sum, w) => sum + w.bbox.y0, 0) / sortedLine.length;
        const height = sortedLine[0].bbox.y1 - sortedLine[0].bbox.y0;
        
        const isAllCaps = sortedLine.every(w => w.text === w.text.toUpperCase() && w.text.length > 1);
        const isTitleCase = sortedLine.every(w => {
          const wordsInLine = w.text.split(" ");
          return wordsInLine.every((word, idx) => {
            if (idx === 0) return word[0] === word[0].toUpperCase();
            return true;
          });
        });
        
        lines.push({
          text: lineText,
          bbox: {
            x0: minX,
            y0: Math.min(...sortedLine.map(w => w.bbox.y0)),
            x1: maxX,
            y1: Math.max(...sortedLine.map(w => w.bbox.y1)),
          },
          y: avgY,
          isHeading: isAllCaps || (height > 14 && isTitleCase && sortedLine.length <= 4),
          headingLevel: height > 18 ? 1 : height > 14 ? 2 : 0,
        });
      }
      currentLine = [word];
      currentY = word.bbox.y0;
    }
  });
  
  if (currentLine.length > 0) {
    const sortedLine = currentLine.sort((a, b) => a.bbox.x0 - b.bbox.x0);
    const lineText = sortedLine.map(w => w.text).join(" ");
    const minX = Math.min(...sortedLine.map(w => w.bbox.x0));
    const maxX = Math.max(...sortedLine.map(w => w.bbox.x1));
    const avgY = sortedLine.reduce((sum, w) => sum + w.bbox.y0, 0) / sortedLine.length;
    const height = sortedLine[0].bbox.y1 - sortedLine[0].bbox.y0;
    
    const isAllCaps = sortedLine.every(w => w.text === w.text.toUpperCase() && w.text.length > 1);
    const isTitleCase = sortedLine.every(w => {
      const wordsInLine = w.text.split(" ");
      return wordsInLine.every((word, idx) => {
        if (idx === 0) return word[0] === word[0].toUpperCase();
        return true;
      });
    });
    
    lines.push({
      text: lineText,
      bbox: {
        x0: minX,
        y0: Math.min(...sortedLine.map(w => w.bbox.y0)),
        x1: maxX,
        y1: Math.max(...sortedLine.map(w => w.bbox.y1)),
      },
      y: avgY,
      isHeading: isAllCaps || (height > 14 && isTitleCase && sortedLine.length <= 4),
      headingLevel: height > 18 ? 1 : height > 14 ? 2 : 0,
    });
  }
  
  return lines;
}

function detectColumns(lines: TextLine[], pageWidth: number): { columns: number; widths: number[] } {
  if (lines.length < 5) {
    return { columns: 1, widths: [pageWidth] };
  }
  
  const leftAligned = lines.filter(l => l.bbox.x0 < pageWidth * 0.4);
  const rightAligned = lines.filter(l => l.bbox.x0 > pageWidth * 0.5);
  
  if (rightAligned.length > leftAligned.length * 0.3 && pageWidth > 400) {
    const leftWidth = Math.max(...leftAligned.map(l => l.bbox.x1)) || pageWidth / 2;
    const rightMinX = Math.min(...rightAligned.map(l => l.bbox.x0)) || pageWidth / 2;
    
    return {
      columns: 2,
      widths: [leftWidth, pageWidth - rightMinX],
    };
  }
  
  return { columns: 1, widths: [pageWidth] };
}

function detectSections(lines: TextLine[]): LayoutSection[] {
  const sections: LayoutSection[] = [];
  let currentSection: LayoutSection | null = null;
  
  lines.forEach((line, index) => {
    const lowerText = line.text.toLowerCase().trim();
    
    const isHeader = HEADER_KEYWORDS.some(keyword => 
      lowerText === keyword || 
      lowerText === keyword + "s" ||
      lowerText === keyword + ":" ||
      lowerText === keyword + "s:"
    );
    
    const isNameLine = line.isHeading && line.text.split(" ").length <= 4 && 
      !HEADER_KEYWORDS.some(k => lowerText.includes(k)) &&
      index < 3;
    
    if (isNameLine && !currentSection) {
      currentSection = {
        id: "header",
        type: "header",
        title: line.text,
        bbox: line.bbox,
        confidence: 0.9,
      };
      return;
    }
    
    if (isHeader && line.isHeading) {
      if (currentSection) {
        sections.push(currentSection);
      }
      
      let sectionType: LayoutSection["type"] = "other";
      
      if (lowerText.includes("experience") || lowerText.includes("employment") || lowerText.includes("work")) {
        sectionType = "experience";
      } else if (lowerText.includes("education") || lowerText.includes("academic")) {
        sectionType = "education";
      } else if (lowerText.includes("skill")) {
        sectionType = "skills";
      } else if (lowerText.includes("project")) {
        sectionType = "projects";
      } else if (lowerText.includes("certification") || lowerText.includes("certificate")) {
        sectionType = "certifications";
      } else if (lowerText.includes("language")) {
        sectionType = "languages";
      } else if (lowerText.includes("summary") || lowerText.includes("objective") || lowerText.includes("profile")) {
        sectionType = "summary";
      } else if (lowerText.includes("contact")) {
        sectionType = "contact";
      }
      
      currentSection = {
        id: `${sectionType}_${sections.length}`,
        type: sectionType,
        title: line.text,
        bbox: line.bbox,
        confidence: 0.8,
      };
    } else if (currentSection) {
      currentSection.bbox.y1 = line.bbox.y1;
    }
  });
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}

function estimateFontSizes(lines: TextLine[]): LayoutAnalysis["fontSizes"] {
  const headingSizes: number[] = [];
  const subheadingSizes: number[] = [];
  const bodySizes: number[] = [];
  const smallSizes: number[] = [];
  
  lines.forEach(line => {
    const height = line.bbox.y1 - line.bbox.y0;
    
    if (line.isHeading || line.headingLevel === 1) {
      headingSizes.push(height);
    } else if (line.headingLevel === 2) {
      subheadingSizes.push(height);
    } else if (height < 10) {
      smallSizes.push(height);
    } else {
      bodySizes.push(height);
    }
  });
  
  const avg = (arr: number[]) => arr.length > 0 
    ? arr.reduce((a, b) => a + b, 0) / arr.length 
    : 12;
  
  return {
    heading: Math.round(avg(headingSizes) || 18),
    subheading: Math.round(avg(subheadingSizes) || 14),
    body: Math.round(avg(bodySizes) || 11),
    small: Math.round(avg(smallSizes) || 9),
  };
}

function estimateLineHeight(fontSize: number): number {
  return Math.round(fontSize * 1.4);
}

function detectMargins(lines: TextLine[], pageWidth: number, pageHeight: number): LayoutAnalysis["margins"] {
  const leftEdges = lines.map(l => l.bbox.x0);
  const rightEdges = lines.map(l => pageWidth - l.bbox.x1);
  const topEdges = lines.map(l => l.bbox.y0);
  const bottomEdges = lines.map(l => pageHeight - l.bbox.y1);
  
  const avg = (arr: number[]) => arr.length > 0 
    ? arr.reduce((a, b) => a + b, 0) / arr.length 
    : 0;
  
  return {
    left: Math.round(avg(leftEdges.sort((a, b) => a - b).slice(0, Math.ceil(lines.length * 0.1)))),
    right: Math.round(avg(rightEdges.sort((a, b) => a - b).slice(0, Math.ceil(lines.length * 0.1)))),
    top: Math.round(avg(topEdges.sort((a, b) => a - b).slice(0, Math.ceil(lines.length * 0.1)))),
    bottom: Math.round(avg(bottomEdges.sort((a, b) => a - b).slice(0, Math.ceil(lines.length * 0.1)))),
  };
}

export function analyzeLayout(ocrResults: OCRResult[], imageWidth: number, imageHeight: number): LayoutAnalysis {
  const words: WordPosition[] = ocrResults.map(w => ({
    text: w.text,
    bbox: w.bbox,
    confidence: w.confidence,
  }));
  
  const lines = groupWordsIntoLines(words);
  
  const { columns, widths } = detectColumns(lines, imageWidth);
  
  const sections = detectSections(lines);
  
  const fontSizes = estimateFontSizes(lines);
  
  const margins = detectMargins(lines, imageWidth, imageHeight);
  
  const lineHeight = estimateLineHeight(fontSizes.body);
  
  let layout: LayoutAnalysis["layout"] = "single";
  if (columns === 2) {
    layout = "double";
  } else if (sections.length > 6) {
    layout = "complex";
  }

  const blocks: LayoutBlock[] = lines.map((line, index) => {
    const height = Math.max(line.bbox.y1 - line.bbox.y0, 10);
    let fontWeight = 400;
    if (line.headingLevel === 1) {
      fontWeight = 700;
    } else if (line.headingLevel === 2) {
      fontWeight = 600;
    }

    const section = sections.find(
      (section) =>
        line.bbox.y0 >= section.bbox.y0 - 4 &&
        line.bbox.y1 <= section.bbox.y1 + 4 &&
        line.bbox.x0 >= section.bbox.x0 - 8 &&
        line.bbox.x1 <= section.bbox.x1 + 8
    );

    return {
      id: `block_${index}`,
      text: line.text,
      bbox: {
        x0: Math.max(line.bbox.x0, 0),
        y0: Math.max(line.bbox.y0, 0),
        x1: Math.max(line.bbox.x1, line.bbox.x0 + 4),
        y1: Math.max(line.bbox.y1, line.bbox.y0 + 12),
      },
      fontSize: Math.round(height * 0.9) || fontSizes.body,
      fontWeight,
      isHeading: line.isHeading,
      sectionId: section?.id,
      sectionType: section?.type,
    };
  });

  if (blocks.length === 0 && ocrResults.length > 0) {
    ocrResults.forEach((block, index) => {
      blocks.push({
        id: `fallback_${index}`,
        text: block.text,
        bbox: {
          x0: block.bbox.x0,
          y0: block.bbox.y0,
          x1: Math.max(block.bbox.x1, block.bbox.x0 + 4),
          y1: Math.max(block.bbox.y1, block.bbox.y0 + 12),
        },
        fontSize: fontSizes.body,
        fontWeight: 400,
        isHeading: false,
      });
    });
  }
  
  return {
    columns,
    columnWidths: widths,
    sections,
    fontSizes,
    layout,
    pageWidth: imageWidth,
    pageHeight: imageHeight,
    lineHeight,
    margins,
    blocks,
  };
}

export function getFullTextFromOCR(ocrResults: OCRResult[]): string {
  const words = ocrResults.map(w => w.text);
  return words.join(" ");
}

export const LayoutAnalyzer = {
  analyzeLayout,
  getFullTextFromOCR,
  groupWordsIntoLines,
  detectColumns,
  detectSections,
};

export default LayoutAnalyzer;
