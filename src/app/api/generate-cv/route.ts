import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export interface CVGenerationRequest {
  extractedText: string;
  image?: {
    base64: string;
    mimeType: string;
  };
  colorPalette?: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
    sidebar?: string;
    header?: string;
  };
  layoutData?: {
    columns: number;
    columnWidths: number[];
    fontSizes: {
      heading: number;
      subheading: number;
      body: number;
      small: number;
    };
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    lineHeight: number;
    sections: Array<{
      id: string;
      type: string;
      title: string;
      bbox: { x0: number; y0: number; x1: number; y1: number };
    }>;
    pageSize: { width: number; height: number };
    structure?: string;
  };
  blocks?: Array<{
    text: string;
    fontSize?: number;
    fontWeight?: number;
    sectionType?: string;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
  model?: string;
}

export interface CVGenerationResponse {
  html: string;
  css: string;
  success: boolean;
  error?: string;
  processingTime?: number;
  modelUsed?: string;
  accuracyScore?: number;
  selfCritique?: string;
}

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SYSTEM_PROMPT = `You are an expert CV replication AI. Your task is to create HTML/CSS that looks IDENTICAL to the provided CV image.

CRITICAL REQUIREMENTS:
1. Copy ALL text exactly as it appears - use the actual text, not placeholders
2. Use the exact colors provided in the hex codes
3. Match fonts, sizes, and layout exactly
4. Include all sections in correct order
5. Maintain exact spacing and positioning
6. Create pixel-perfect boundaries - no overflow, proper backgrounds

You have TWO jobs:
1. Generate the HTML/CSS replica
2. Judge your own work and provide an accuracy score (0-100%)

Return JSON in this exact format:
{
  "html": "<!DOCTYPE html><html>...</html>",
  "css": "...",
  "accuracyScore": 95,
  "selfCritique": "Brief explanation of accuracy and any minor issues"
}`;

function buildPrompt(request: CVGenerationRequest): string {
  const { extractedText, colorPalette, layoutData, blocks } = request;

  let prompt = `REPLICATE THIS CV EXACTLY - EVERY PIXEL MATTERS

Look at the CV image provided and create an identical HTML/CSS version.

`;

  if (layoutData) {
    prompt += `LAYOUT INFO:
- Page: ${Math.round(layoutData.pageSize.width)}px × ${Math.round(layoutData.pageSize.height)}px
- Columns: ${layoutData.columns}
- Structure: ${layoutData.structure || 'single'}
- Margins: ${layoutData.margins.top}/${layoutData.margins.right}/${layoutData.margins.bottom}/${layoutData.margins.left}
- Font sizes: Heading ${layoutData.fontSizes.heading}px, Body ${layoutData.fontSizes.body}px

`;
  }

  if (colorPalette) {
    prompt += `EXACT COLORS TO USE:
- Background: ${colorPalette.background}
- Text: ${colorPalette.text}
- Primary: ${colorPalette.primary}
- Secondary: ${colorPalette.secondary}
- Accent: ${colorPalette.accent}
`;
    if (colorPalette.sidebar) prompt += `- Sidebar: ${colorPalette.sidebar}\n`;
    if (colorPalette.header) prompt += `- Header: ${colorPalette.header}\n`;
    prompt += `
`;
  }

  if (blocks && blocks.length > 0) {
    prompt += `TEXT BLOCKS (${blocks.length} total):
`;
    blocks.slice(0, 30).forEach((block, i) => {
      prompt += `${i + 1}. "${block.text.substring(0, 80)}${block.text.length > 80 ? '...' : ''}"\n`;
    });
    if (blocks.length > 30) prompt += `... and ${blocks.length - 30} more\n`;
    prompt += `
`;
  }

  prompt += `COMPLETE TEXT CONTENT:
---
${extractedText}
---

INSTRUCTIONS:
1. Study the CV image carefully
2. Create HTML/CSS that looks EXACTLY like it
3. Use all the text provided above - every word
4. Apply the exact colors from the palette
5. Match layout structure and positioning
6. After generating, judge your own work
7. Return accuracy score (0-100) and brief self-critique

REMEMBER: You are COPYING, not creating. Every detail matters.

Return ONLY valid JSON with html, css, accuracyScore, and selfCritique fields.`;

  return prompt;
}

async function callGemini(
  prompt: string,
  modelName: string,
  imageData?: { base64: string; mimeType: string }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  if (imageData) {
    const imagePart = {
      inlineData: {
        data: imageData.base64,
        mimeType: imageData.mimeType,
      },
    };

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      "Here is the CV image to replicate:",
      imagePart,
      prompt
    ]);
    const response = await result.response;
    return response.text();
  } else {
    const result = await model.generateContent([SYSTEM_PROMPT, prompt]);
    const response = await result.response;
    return response.text();
  }
}

function parseResponse(response: string): { 
  html: string; 
  css: string; 
  accuracyScore: number;
  selfCritique: string;
} {
  // Try to extract JSON
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        html: String(parsed.html || ''),
        css: String(parsed.css || ''),
        accuracyScore: Number(parsed.accuracyScore) || Number(parsed.score) || 85,
        selfCritique: String(parsed.selfCritique || parsed.critique || 'No critique provided')
      };
    }
  } catch {
    console.log("JSON parse failed, trying extraction");
  }

  // Fallback extraction
  const htmlMatch = response.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
  const cssMatch = response.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  
  return {
    html: htmlMatch ? htmlMatch[0] : response,
    css: cssMatch ? cssMatch[1] : "",
    accuracyScore: 75,
    selfCritique: "Extraction fallback used"
  };
}

function generateFallbackHTML(request: CVGenerationRequest): string {
  const c = request.colorPalette || {
    primary: "#1a365d",
    secondary: "#4a5568",
    background: "#ffffff",
    text: "#2d3748",
    accent: "#3182ce"
  };

  const paragraphs = request.extractedText
    .split(/\n\n+/)
    .filter(p => p.trim().length > 0)
    .slice(0, 20);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CV - Generated</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: ${c.text};
      background: ${c.background};
      padding: 40px;
      max-width: 850px;
      margin: 0 auto;
    }
    .content {
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div class="content">
${paragraphs.join('\n\n')}
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: CVGenerationRequest = await request.json();

    if (!body.extractedText || body.extractedText.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "No text provided", html: "", css: "" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY not configured", html: "", css: "" },
        { status: 503 }
      );
    }

    const model = body.model || DEFAULT_MODEL;
    const prompt = buildPrompt(body);

    let html: string;
    let css: string;
    let accuracyScore: number;
    let selfCritique: string;
    let usedFallback = false;

    try {
      console.log("Calling Gemini for CV generation...");
      console.log("Has image:", !!body.image);
      console.log("Text length:", body.extractedText.length);

      const geminiResponse = await callGemini(prompt, model, body.image);
      console.log("Response length:", geminiResponse.length);

      const parsed = parseResponse(geminiResponse);
      html = parsed.html;
      css = parsed.css;
      accuracyScore = parsed.accuracyScore;
      selfCritique = parsed.selfCritique;

      console.log("Parsed result:", {
        htmlLength: html.length,
        cssLength: css.length,
        accuracyScore,
        hasCritique: !!selfCritique
      });

      // Check for placeholder text
      if (html.includes("[Your Name]") || html.includes("email@example.com")) {
        console.warn("⚠️ Placeholder text detected in generated HTML");
      }

    } catch (geminiError) {
      console.error("Gemini failed:", geminiError);
      console.log("Using fallback HTML template");
      
      html = generateFallbackHTML(body);
      css = "";
      accuracyScore = 60;
      selfCritique = "Fallback template used due to generation error";
      usedFallback = true;
    }

    const processingTime = Date.now() - startTime;

    console.log(`\n✅ Completed in ${processingTime}ms`);
    console.log(`   Accuracy score: ${accuracyScore}%`);
    console.log(`   Used fallback: ${usedFallback}`);

    return NextResponse.json({
      success: true,
      html,
      css,
      processingTime,
      modelUsed: usedFallback ? "fallback" : model,
      accuracyScore,
      selfCritique: selfCritique.substring(0, 500)
    });

  } catch (error) {
    console.error("CV Generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        html: "",
        css: "",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      status: "disconnected",
      note: "Set GEMINI_API_KEY to enable AI-powered CV generation",
    });
  }

  return NextResponse.json({
    status: "connected",
    model: DEFAULT_MODEL,
  });
}
