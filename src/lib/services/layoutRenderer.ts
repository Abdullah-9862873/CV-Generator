import { LayoutAnalysis, LayoutBlock } from "./layoutAnalyzer";

interface HexPalette {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

interface RenderParams {
  blocks: LayoutBlock[];
  layout: LayoutAnalysis;
  colorPalette: HexPalette;
  fullText: string;
  originalImageUrl?: string; // For exact background matching
  preserveBoundaries?: boolean;
}

interface RegionStyle {
  backgroundColor?: string;
  backgroundImage?: string;
  borderColor?: string;
  borderWidth?: string;
  borderStyle?: string;
}

const escapeHTML = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeBlocks = (blocks: LayoutBlock[], fallbackText: string): LayoutBlock[] => {
  if (blocks.length > 0) return blocks;
  if (!fallbackText || fallbackText.trim().length === 0) return [];
  return [
    {
      id: "fallback",
      text: fallbackText,
      bbox: { x0: 40, y0: 40, x1: 960, y1: 1200 },
      fontSize: 14,
      fontWeight: 400,
      isHeading: false,
    },
  ];
};

/**
 * Detect regions with different background colors by analyzing the layout
 */
function detectBackgroundRegions(
  layout: LayoutAnalysis,
  colorPalette: HexPalette
): Map<string, RegionStyle> {
  const regions = new Map<string, RegionStyle>();
  
  // Check if this is a sidebar layout
  const hasSidebar = layout.columns === 2 && layout.columnWidths[0] < layout.pageWidth * 0.4;
  
  if (hasSidebar) {
    // Left sidebar typically has different background
    regions.set('sidebar', {
      backgroundColor: colorPalette.secondary,
    });
    
    // Main content area
    regions.set('main', {
      backgroundColor: colorPalette.background,
    });
  }
  
  // Check sections for different backgrounds
  layout.sections.forEach(section => {
    if (section.type === 'header') {
      regions.set(`section-${section.id}`, {
        backgroundColor: colorPalette.primary,
      });
    }
  });
  
  return regions;
}

/**
 * Group blocks into rows based on Y position
 */
function groupBlocksIntoRows(blocks: LayoutBlock[], tolerance: number = 10): LayoutBlock[][] {
  if (blocks.length === 0) return [];
  
  const sorted = [...blocks].sort((a, b) => a.bbox.y0 - b.bbox.y0);
  const rows: LayoutBlock[][] = [];
  let currentRow: LayoutBlock[] = [sorted[0]];
  let currentY = sorted[0].bbox.y0;
  
  for (let i = 1; i < sorted.length; i++) {
    const block = sorted[i];
    if (Math.abs(block.bbox.y0 - currentY) <= tolerance) {
      currentRow.push(block);
    } else {
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [block];
      currentY = block.bbox.y0;
    }
  }
  
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }
  
  return rows;
}

/**
 * Generate CSS for exact boundary preservation
 */
function generateBoundaryCSS(
  layout: LayoutAnalysis,
  colorPalette: HexPalette,
  preserveBoundaries: boolean = true
): string {
  if (!preserveBoundaries) return '';
  
  const { pageWidth, pageHeight } = layout;
  
  return `
/* Exact boundary preservation */
.cv-page {
  width: ${pageWidth}px !important;
  min-height: ${pageHeight}px !important;
  max-height: ${pageHeight}px !important;
  overflow: hidden !important;
  position: relative !important;
  box-sizing: border-box !important;
}

.cv-page * {
  box-sizing: border-box !important;
}

/* Ensure content stays within bounds */
.cv-content {
  width: 100% !important;
  height: 100% !important;
  overflow: hidden !important;
  position: relative !important;
}

/* Background layer */
.cv-background {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  z-index: 0 !important;
}

/* Content layer */
.cv-blocks-container {
  position: relative !important;
  z-index: 1 !important;
  width: 100% !important;
  height: 100% !important;
}
`;
}

/**
 * Render HTML for exact replica with preserved boundaries
 */
export const renderExactReplica = ({
  blocks,
  layout,
  colorPalette,
  fullText,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  originalImageUrl,
  preserveBoundaries = true,
}: RenderParams): { html: string; css: string } => {
  const normalizedBlocks = normalizeBlocks(blocks, fullText);
  const pageWidth = layout.pageWidth || 1024;
  const pageHeight = layout.pageHeight || 1320;
  
  const clamp = (value: number | undefined, fallback: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) return fallback;
    return Math.min(Math.max(value, 8), 120);
  };
  
  const paddingTop = clamp(layout.margins?.top, 24);
  const paddingRight = clamp(layout.margins?.right, 24);
  const paddingBottom = clamp(layout.margins?.bottom, 24);
  const paddingLeft = clamp(layout.margins?.left, 24);
  
  // Detect background regions - currently computed for potential future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const backgroundRegions = detectBackgroundRegions(layout, colorPalette);

  // Group blocks into rows for better layout - currently computed for potential future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const rows = groupBlocksIntoRows(normalizedBlocks);
  
  // Generate text blocks with exact positioning
  const blockHTML = normalizedBlocks
    .map((block, index) => {
      const width = Math.max(block.bbox.x1 - block.bbox.x0, 10);
      const height = Math.max(block.bbox.y1 - block.bbox.y0, 8);
      const fontSize = clamp(block.fontSize, layout.fontSizes.body);
      const top = Math.max(block.bbox.y0 - paddingTop, 0);
      const left = Math.max(block.bbox.x0 - paddingLeft, 0);
      const text = escapeHTML(block.text || "");
      const fontWeight = block.fontWeight || 400;
      const isHeading = block.isHeading || fontWeight >= 600;
      
      // Determine text color based on position (headers might need different color)
      let textColor = colorPalette.text;
      if (block.sectionType === 'header' || (isHeading && top < 100)) {
        textColor = colorPalette.background; // White text on colored header
      }
      
      return `    <div class="text-block ${isHeading ? 'heading' : 'body'} block-${index}" data-section="${block.sectionType || 'other'}" style="top:${top}px;left:${left}px;width:${width}px;${height > 30 ? `height:${height}px;` : ''}font-size:${fontSize}px;font-weight:${fontWeight};color:${textColor};">${text}</div>`;
    })
    .join("\n");

  // Generate background layers HTML
  let backgroundHTML = '';
  
  if (layout.columns === 2 && layout.columnWidths[0] < pageWidth * 0.4) {
    // Sidebar layout
    const sidebarWidth = layout.columnWidths[0];
    backgroundHTML = `
    <!-- Sidebar Background -->
    <div class="cv-sidebar-bg" style="position:absolute;top:0;left:0;width:${sidebarWidth}px;height:100%;background-color:${colorPalette.secondary};z-index:0;"></div>
    <!-- Main Content Background -->
    <div class="cv-main-bg" style="position:absolute;top:0;left:${sidebarWidth}px;right:0;height:100%;background-color:${colorPalette.background};z-index:0;"></div>`;
  } else {
    // Single column with full background
    backgroundHTML = `
    <!-- Full Page Background -->
    <div class="cv-full-bg" style="position:absolute;top:0;left:0;width:100%;height:100%;background-color:${colorPalette.background};z-index:0;"></div>`;
  }
  
  // Add header background if detected
  const headerSection = layout.sections.find(s => s.type === 'header');
  if (headerSection) {
    const headerHeight = headerSection.bbox.y1 - headerSection.bbox.y0 + 40;
    backgroundHTML += `
    <!-- Header Background -->
    <div class="cv-header-bg" style="position:absolute;top:0;left:0;width:100%;height:${headerHeight}px;background-color:${colorPalette.primary};z-index:1;"></div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CV Replica</title>
  <style>PLACEHOLDER_CSS</style>
</head>
<body>
  <div class="cv-page">
    <div class="cv-background">
${backgroundHTML}
    </div>
    <div class="cv-blocks-container">
${blockHTML}
    </div>
  </div>
</body>
</html>`;

  const boundaryCSS = generateBoundaryCSS(layout, colorPalette, preserveBoundaries);

  const css = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  margin: 0;
  padding: 20px;
  background: #e5e7eb;
  font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.cv-page {
  position: relative;
  width: ${pageWidth}px;
  height: ${pageHeight}px;
  background: ${colorPalette.background};
  color: ${colorPalette.text};
  border: none;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
  overflow: hidden;
  page-break-after: always;
  page-break-inside: avoid;
}

.cv-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.cv-blocks-container {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  padding: ${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px;
}

.text-block {
  position: absolute;
  white-space: pre-wrap;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-block.heading {
  font-weight: 600;
  letter-spacing: -0.01em;
}

.text-block.body {
  font-weight: 400;
  line-height: 1.4;
}

/* Print styles */
@media print {
  body {
    padding: 0;
    background: white;
  }
  
  .cv-page {
    box-shadow: none;
    margin: 0;
    page-break-after: always;
    page-break-inside: avoid;
  }
}

/* Responsive scaling for preview */
@media screen and (max-width: ${pageWidth + 40}px) {
  body {
    padding: 10px;
  }
  
  .cv-page {
    transform: scale(calc(100vw / ${pageWidth + 40}));
    transform-origin: top center;
    margin-bottom: calc(-${pageHeight}px * (1 - calc(100vw / ${pageWidth + 40})));
  }
}

${boundaryCSS}`;

  return { html: html.replace("<style>PLACEHOLDER_CSS</style>", `<style>${css}</style>`), css };
};

/**
 * Enhanced renderer that creates pixel-perfect replica
 */
export const renderDeterministicCV = ({
  blocks,
  layout,
  colorPalette,
  fullText,
}: RenderParams): { html: string; css: string } => {
  // Use the new exact replica renderer
  return renderExactReplica({
    blocks,
    layout,
    colorPalette,
    fullText,
    preserveBoundaries: true,
  });
};

/**
 * Render a CV with background image for exact color matching
 */
export const renderWithBackgroundImage = async ({
  blocks,
  layout,
  colorPalette,
  fullText,
  originalImageUrl,
}: RenderParams & { originalImageUrl: string }): Promise<{ html: string; css: string }> => {
  const base = renderExactReplica({
    blocks,
    layout,
    colorPalette,
    fullText,
    originalImageUrl,
    preserveBoundaries: true,
  });
  
  // Add background image CSS
  const enhancedCSS = base.css + `

/* Original CV Background Image */
.cv-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('${originalImageUrl}');
  background-size: cover;
  background-position: center;
  opacity: 0.1; /* Very subtle, just for color reference */
  z-index: -1;
  pointer-events: none;
}
`;

  return { html: base.html.replace(base.css, enhancedCSS), css: enhancedCSS };
};

export default {
  renderExactReplica,
  renderDeterministicCV,
  renderWithBackgroundImage,
};
