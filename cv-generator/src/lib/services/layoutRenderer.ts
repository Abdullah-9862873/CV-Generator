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

export const renderDeterministicCV = ({
  blocks,
  layout,
  colorPalette,
  fullText,
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

  const blockHTML = normalizedBlocks
    .map((block, index) => {
      const width = Math.max(block.bbox.x1 - block.bbox.x0, 10);
      const height = Math.max(block.bbox.y1 - block.bbox.y0, 8);
      const fontSize = block.fontSize || layout.fontSizes.body;
      const top = Math.max(block.bbox.y0 - paddingTop, 0);
      const left = Math.max(block.bbox.x0 - paddingLeft, 0);
      const text = escapeHTML(block.text || "");
      const fontWeight = block.fontWeight || 400;

      return `    <div class="text-block block-${index}" style="top:${top}px;left:${left}px;width:${width}px;height:${height}px;font-size:${fontSize}px;font-weight:${fontWeight};">${text}</div>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CV</title>
  <style>PLACEHOLDER_CSS</style>
</head>
<body>
  <div class="cv-page">
${blockHTML}
  </div>
</body>
</html>`;

  const css = `* {
  box-sizing: border-box;
}
body {
  margin: 0;
  padding: 0;
  background: #e5e7eb;
  font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
}
.cv-page {
  position: relative;
  width: ${pageWidth}px;
  height: ${pageHeight}px;
  margin: 20px auto;
  background: ${colorPalette.background};
  color: ${colorPalette.text};
  border: 1px solid #d0d5dd;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
  padding: ${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px;
  overflow: hidden;
}
.text-block {
  position: absolute;
  white-space: pre-wrap;
  line-height: 1.2;
  color: ${colorPalette.text};
}
.text-block strong {
  color: ${colorPalette.primary};
}`;

  return { html: html.replace("<style>PLACEHOLDER_CSS</style>", `<style>${css}</style>`), css };
};

export default renderDeterministicCV;
