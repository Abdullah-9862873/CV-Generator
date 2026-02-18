import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini SDK requires Node.js runtime to access process/env and native fetch.
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
}

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SYSTEM_PROMPT = `You are a PIXEL-PERFECT HTML/CSS CV REPLICATION ENGINE.

════════════════════════════════════════════════════════════
MISSION: COPY THE CV IMAGE EXACTLY — DO NOT REDESIGN IT
════════════════════════════════════════════════════════════

You will receive:
1. A CV image (analyze it visually)
2. Extracted text with bounding-box positions
3. Color palette (exact hex codes)
4. Layout measurements

Your task: produce a single self-contained HTML file that, when rendered at 794px wide, looks IDENTICAL to the original CV image.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY TECHNICAL REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAGE SETUP (CRITICAL):
- The rendered page width MUST be exactly 794px (A4 at 96dpi)
- Set: html, body { width: 794px; margin: 0 auto; }
- Do NOT set overflow: hidden on body or html — content must be fully visible
- Do NOT clip or hide any content
- The page should be as tall as the content requires
- All CSS must be embedded inside a <style> tag in the <head> — NO external stylesheets
- Fonts may be loaded via @import from Google Fonts if needed

COLORS (USE EXACT HEX CODES PROVIDED):
- Apply the provided primary color to: headers, sidebar backgrounds, section titles, accent bars
- Apply the provided background color to: page background
- Apply the provided text color to: body text
- Apply the provided secondary color to: subtitles, dates, secondary text
- Apply the provided accent color to: highlights, icons, bullets, lines
- If the CV has a colored sidebar: use the primary color as the sidebar background
- If the CV has a colored header bar: use the primary color as the header background with white text

LAYOUT (REPLICATE EXACTLY):
- If the image shows a 2-column layout: use CSS Grid or Flexbox with the EXACT column width ratio
- If the image shows a sidebar: the sidebar must have the EXACT same width percentage as in the image
- Measure the sidebar width from the bounding boxes provided
- Replicate ALL section spacing exactly
- Replicate ALL padding and margins exactly
- Section dividers, horizontal rules, and decorative lines must be replicated

TYPOGRAPHY (MATCH EXACTLY):
- Identify the font from the image by looking at letter shapes
- Name font size: typically 24-36px, bold
- Section title font size: typically 12-16px, often uppercase or bold
- Body text font size: typically 10-12px
- Match font-weight, font-style, text-transform, letter-spacing for each element
- Match text-align (left, center, right) for each section

TEXT CONTENT (COPY VERBATIM):
- Use EVERY word from the extracted text — do NOT omit anything
- Do NOT use placeholder text like "[Your Name]", "email@example.com", "Job Title"
- Copy the ACTUAL name, email, phone, address, job titles, companies, dates, skills, education
- Preserve the EXACT same order of sections as in the image
- Preserve bullet points, dashes, and list formatting

VISUAL ELEMENTS:
- Profile photo area: if visible in image, add a placeholder div with exact dimensions and border-radius
- Icons: replicate using Unicode symbols or CSS shapes
- Horizontal dividers: replicate with hr or border-bottom
- Colored bars or accent lines: replicate with CSS border or background
- Progress bars or skill bars: replicate with CSS width percentages
- Circular or rounded elements: replicate with border-radius

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT (STRICT — NO EXCEPTIONS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY this JSON object (no markdown, no code fences, no explanations):
{"html": "<!DOCTYPE html><html lang=\"en\"><head>...</head><body>...</body></html>", "css": ""}

NOTE: Put ALL CSS inside a <style> tag in the HTML <head>. The "css" field must be an empty string "".

The HTML must be:
- Complete and valid
- Self-contained (no external resources except Google Fonts @import)
- Rendered at exactly 794px wide
- Pixel-perfect match to the original CV image
- Using ACTUAL text from the CV (no placeholders)
- With overflow visible (no clipping)

DO NOT use markdown code blocks.
DO NOT use placeholder text.
DO NOT redesign or improve the CV.
DO NOT omit sections or content.
DO NOT set overflow: hidden on body.

REMEMBER: Someone will place your HTML output side-by-side with the original CV image. They must be IDENTICAL.`;

function buildUserPrompt(request: CVGenerationRequest): string {
  const fullText = request.extractedText;

  let prompt = "════════════════════════════════════════════════════════════\n";
  prompt += "CV REPLICATION TASK — COPY THIS CV EXACTLY\n";
  prompt += "════════════════════════════════════════════════════════════\n\n";

  if (request.image) {
    prompt += "STEP 1: VISUAL ANALYSIS OF THE CV IMAGE\n";
    prompt += "────────────────────────────────────────\n\n";
    prompt += "Look at the CV image provided and identify:\n\n";
    prompt += "LAYOUT TYPE:\n";
    prompt += "- Is it single-column or multi-column?\n";
    prompt += "- Is there a sidebar? If yes, what percentage of the page width is it? (e.g., 30%, 35%, 40%)\n";
    prompt += "- Is there a colored header bar at the top?\n";
    prompt += "- Is there a colored sidebar on the left or right?\n\n";

    prompt += "COLORS OBSERVED IN IMAGE:\n";
    prompt += "- What color is the header/name area background?\n";
    prompt += "- What color is the sidebar background?\n";
    prompt += "- What color are the section titles?\n";
    prompt += "- What color is the body text?\n";
    prompt += "- Are there any accent colors (lines, bullets, icons)?\n\n";

    prompt += "TYPOGRAPHY OBSERVED:\n";
    prompt += "- What font family does the CV use? (look at letter shapes carefully)\n";
    prompt += "- How large is the person's name? (estimate in px)\n";
    prompt += "- Are section titles uppercase? Bold? What size?\n";
    prompt += "- What is the body text size?\n\n";

    prompt += "VISUAL ELEMENTS:\n";
    prompt += "- Are there horizontal divider lines between sections?\n";
    prompt += "- Are there skill bars or progress indicators?\n";
    prompt += "- Is there a profile photo area?\n";
    prompt += "- Are there icons next to contact info?\n";
    prompt += "- Are there decorative elements (dots, lines, shapes)?\n\n";
  }

  if (request.layoutData) {
    const layout = request.layoutData;
    prompt += "STEP 2: LAYOUT SPECIFICATIONS\n";
    prompt += "────────────────────────────────────────\n\n";
    prompt += "PAGE DIMENSIONS:\n";
    prompt += "   Rendered width: 794px (A4)\n";
    prompt += "   Detected page: " + Math.round(layout.pageSize.width) + "x" + Math.round(layout.pageSize.height) + "px\n\n";

    prompt += "LAYOUT STRUCTURE:\n";
    prompt += "   Type: " + (layout.structure || "single-column") + "\n";
    prompt += "   Columns: " + layout.columns + "\n";
    if (layout.columnWidths && layout.columnWidths.length > 0) {
      const total = layout.columnWidths.reduce((a, b) => a + b, 0);
      const percentages = layout.columnWidths.map(w => ((w / total) * 100).toFixed(1) + "%");
      prompt += "   Column widths: " + layout.columnWidths.map(w => Math.round(w) + "px").join(", ") + " (" + percentages.join(" / ") + ")\n\n";
    }

    prompt += "MARGINS:\n";
    prompt += "   Top: " + layout.margins.top + "px | Right: " + layout.margins.right + "px | Bottom: " + layout.margins.bottom + "px | Left: " + layout.margins.left + "px\n\n";

    prompt += "FONT SIZES:\n";
    prompt += "   Name/Heading: " + layout.fontSizes.heading + "px\n";
    prompt += "   Subheading: " + layout.fontSizes.subheading + "px\n";
    prompt += "   Body: " + layout.fontSizes.body + "px\n";
    prompt += "   Small: " + layout.fontSizes.small + "px\n";
    prompt += "   Line height: " + layout.lineHeight + "\n\n";

    if (layout.sections && layout.sections.length > 0) {
      prompt += "SECTIONS (top to bottom):\n";
      layout.sections.forEach((section, index) => {
        const w = Math.round(section.bbox.x1 - section.bbox.x0);
        const h = Math.round(section.bbox.y1 - section.bbox.y0);
        const xPct = ((section.bbox.x0 / layout.pageSize.width) * 100).toFixed(1);
        prompt += "   " + (index + 1) + ". " + (section.title || section.type.toUpperCase()) + "\n";
        prompt += "      x=" + Math.round(section.bbox.x0) + "px (" + xPct + "% from left), y=" + Math.round(section.bbox.y0) + "px\n";
        prompt += "      size: " + w + "x" + h + "px\n\n";
      });
    }
  }

  if (request.colorPalette) {
    prompt += "STEP 3: COLOR PALETTE (USE THESE EXACT HEX CODES)\n";
    prompt += "────────────────────────────────────────\n\n";
    prompt += "Primary:    " + request.colorPalette.primary + "  -> use for headers, sidebar bg, section titles, accent bars\n";
    prompt += "Secondary:  " + request.colorPalette.secondary + "  -> use for subtitles, dates, secondary text\n";
    prompt += "Background: " + request.colorPalette.background + "  -> use for page background\n";
    prompt += "Text:       " + request.colorPalette.text + "  -> use for body text\n";
    prompt += "Accent:     " + request.colorPalette.accent + "  -> use for highlights, icons, bullets, lines\n\n";
    prompt += "WARNING: Do NOT substitute these colors. Use them EXACTLY as provided.\n\n";
  }

  if (request.blocks && request.blocks.length > 0) {
    prompt += "STEP 4: TEXT BLOCKS WITH EXACT POSITIONS\n";
    prompt += "────────────────────────────────────────\n\n";
    prompt += "Each block shows: text content | position (x,y) | size | font | section\n\n";

    request.blocks.slice(0, 200).forEach((block, index) => {
      const content = block.text.trim();
      if (content.length === 0) return;
      const w = Math.round(block.bbox.x1 - block.bbox.x0);
      const h = Math.round(block.bbox.y1 - block.bbox.y0);
      prompt += "[" + (index + 1) + "] \"" + content + "\"\n";
      prompt += "    pos=(" + Math.round(block.bbox.x0) + ", " + Math.round(block.bbox.y0) + ") size=" + w + "x" + h + "px font=" + (block.fontSize || "?") + "px weight=" + (block.fontWeight || 400) + " section=" + (block.sectionType || "?") + "\n\n";
    });
  }

  prompt += "STEP 5: COMPLETE CV TEXT (USE VERBATIM)\n";
  prompt += "────────────────────────────────────────\n\n";
  prompt += "Use EVERY word below. Do NOT change, skip, or paraphrase anything.\n\n";
  prompt += "--- CV TEXT START ---\n";
  prompt += fullText;
  prompt += "\n--- CV TEXT END ---\n\n";

  prompt += "════════════════════════════════════════════════════════════\n";
  prompt += "FINAL CHECKLIST BEFORE GENERATING\n";
  prompt += "════════════════════════════════════════════════════════════\n\n";
  prompt += "Before writing the HTML, confirm:\n";
  prompt += "[ ] I will set html, body { width: 794px; margin: 0 auto; }\n";
  prompt += "[ ] I will NOT set overflow: hidden on body or html\n";
  prompt += "[ ] I will embed ALL CSS in a <style> tag inside <head>\n";
  prompt += "[ ] I will use the EXACT colors from the palette above\n";
  prompt += "[ ] I will replicate the EXACT layout (sidebar width, column ratios)\n";
  prompt += "[ ] I will use the ACTUAL text from the CV (no placeholders)\n";
  prompt += "[ ] I will include ALL sections in the correct order\n";
  prompt += "[ ] I will match fonts, sizes, weights, and spacing\n";
  prompt += "[ ] I will replicate all visual elements (borders, backgrounds, dividers)\n\n";

  prompt += "Now generate the HTML. Return ONLY the JSON object:\n";
  prompt += "{\"html\": \"<!DOCTYPE html>...\", \"css\": \"\"}\n";

  return prompt;
}

async function callGemini(
  prompt: string,
  modelName: string,
  imageData?: { base64: string; mimeType: string }
): Promise<string> {
  console.log("callGemini called, model:", modelName, "hasImage:", !!imageData);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  if (imageData) {
    console.log("Using VISION mode (image + text)");
    const imagePart = {
      inlineData: {
        data: imageData.base64,
        mimeType: imageData.mimeType,
      },
    };

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      "Here is the CV image to analyze and replicate exactly:",
      imagePart,
      "\n\n" + prompt
    ]);
    const response = await result.response;
    const text = response.text();
    console.log("Gemini vision response length:", text.length);
    return text;
  } else {
    console.log("Using TEXT-ONLY mode (no image) — results may be less accurate");
    const result = await model.generateContent([SYSTEM_PROMPT, prompt]);
    const response = await result.response;
    const text = response.text();
    console.log("Gemini text response length:", text.length);
    return text;
  }
}

function parseGeminiResponse(response: string): { html: string; css: string } {
  let jsonStr = response.trim();

  // Strip markdown code fences if present
  jsonStr = jsonStr.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");

  // Try to extract the outermost JSON object
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.html) {
      return { html: parsed.html, css: parsed.css || "" };
    }
  } catch {
    console.log("JSON parse failed, trying HTML extraction");
  }

  // Fallback: extract raw HTML from the response
  const htmlMatch = response.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
  if (htmlMatch) {
    return { html: htmlMatch[0], css: "" };
  }

  return { html: "", css: "" };
}

function generateFallbackHTML(request: CVGenerationRequest): string {
  const c = request.colorPalette || {
    primary: "#1a365d",
    secondary: "#4a5568",
    background: "#ffffff",
    text: "#2d3748",
    accent: "#3182ce"
  };

  // Use actual extracted text as a pre-formatted fallback
  const escapedText = request.extractedText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CV</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 794px;
      margin: 0 auto;
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: ${c.text};
      background: ${c.background};
    }
    .page {
      padding: 40px;
    }
    .header {
      background: ${c.primary};
      color: white;
      padding: 30px 40px;
      margin: -40px -40px 30px -40px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .content {
      white-space: pre-wrap;
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.7;
      color: ${c.text};
    }
    @media print {
      html, body { width: 794px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="content">${escapedText}</div>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    let body: CVGenerationRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request", html: "", css: "" },
        { status: 400 }
      );
    }

    console.log("Generating CV from text, length:", body.extractedText?.length || 0);

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
    const userPrompt = buildUserPrompt(body);

    let html: string;
    let css: string;
    let usedFallback = false;

    try {
      console.log("=== GEMINI API CALL START ===");
      console.log("Model:", model);
      console.log("Has image data:", !!body.image);
      console.log("Text length:", body.extractedText.length);
      console.log("Prompt length:", userPrompt.length);

      const geminiResponse = await callGemini(userPrompt, model, body.image);

      console.log("=== GEMINI RESPONSE RECEIVED ===");
      console.log("Response length:", geminiResponse.length);
      console.log("Response preview:", geminiResponse.substring(0, 300));

      const parsed = parseGeminiResponse(geminiResponse);

      console.log("=== PARSED RESULT ===");
      console.log("Has HTML:", !!parsed.html);
      console.log("HTML length:", parsed.html?.length || 0);

      if (parsed.html.includes("[Your Name]") || parsed.html.includes("email@example.com") || parsed.html.includes("Job Title")) {
        console.warn("WARNING: Generated HTML contains placeholder text — falling back");
        html = generateFallbackHTML(body);
        css = "";
        usedFallback = true;
      } else if (!parsed.html) {
        console.warn("WARNING: No HTML in parsed response — falling back");
        html = generateFallbackHTML(body);
        css = "";
        usedFallback = true;
      } else {
        console.log("HTML appears to use actual content");
        html = parsed.html;
        css = parsed.css;
      }
    } catch (geminiError) {
      console.error("=== GEMINI FAILED ===");
      console.error("Error:", geminiError);

      if (geminiError instanceof Error) {
        console.error("Error message:", geminiError.message);
      }

      html = generateFallbackHTML(body);
      css = "";
      usedFallback = true;
    }

    return NextResponse.json({
      success: true,
      html,
      css,
      processingTime: Date.now() - startTime,
      modelUsed: usedFallback ? "fallback" : model,
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
