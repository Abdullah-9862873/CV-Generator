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

const SYSTEM_PROMPT = `You are a PIXEL-PERFECT HTML/CSS REPLICATION EXPERT. Your ONLY job is to COPY the CV image exactly.

🚨 CRITICAL INSTRUCTIONS - READ CAREFULLY:

THIS IS NOT A REDESIGN TASK. THIS IS A REPLICATION TASK.
DO NOT CREATE A NEW CV. DO NOT IMPROVE THE CV. DO NOT REDESIGN THE CV.
YOU MUST COPY THE EXACT CV FROM THE IMAGE, PIXEL BY PIXEL.

WHAT YOU MUST REPLICATE EXACTLY:

1. **EVERY SINGLE WORD OF TEXT**:
   - Copy ALL text EXACTLY as it appears in the image
   - Same spelling, same punctuation, same capitalization
   - Same line breaks and text wrapping
   - Do NOT paraphrase, summarize, or change ANY text
   - Do NOT add placeholder text like "[Your Name]" or "email@example.com"
   - Use the ACTUAL text from the image

2. **EXACT FONTS**:
   - Identify the EXACT font family from the image (Arial, Calibri, Times New Roman, Georgia, Helvetica, etc.)
   - Match the EXACT font size for each text element (measure from the image)
   - Match the EXACT font weight (100, 200, 300, 400, 500, 600, 700, 800, 900)
   - Match font style (normal, italic, oblique)
   - If you see a serif font, use a serif font. If you see sans-serif, use sans-serif.

3. **EXACT COLORS**:
   - Use the EXACT hex colors provided in the color palette
   - Match text colors, background colors, border colors, accent colors
   - Do NOT use generic colors like #000000 or #ffffff unless they appear in the original
   - Every colored element must match the original

4. **EXACT LAYOUT & POSITIONING**:
   - Copy the EXACT layout structure (1-column, 2-column, sidebar, etc.)
   - Match the EXACT position of every element using the bounding box coordinates provided
   - Match the EXACT spacing between sections
   - Match the EXACT margins and padding
   - Match the EXACT width and height of sections
   - If the CV has a sidebar, replicate it with the EXACT width ratio

5. **EXACT VISUAL ELEMENTS**:
   - Copy ALL borders (thickness, style, color, position)
   - Copy ALL background colors and patterns
   - Copy ALL section dividers and separators
   - Copy ALL icons, bullets, or symbols
   - Copy ALL decorative elements
   - If there's a profile picture, add an <img> placeholder with exact dimensions

6. **EXACT TYPOGRAPHY DETAILS**:
   - Match line-height EXACTLY
   - Match letter-spacing EXACTLY
   - Match text-align (left, center, right, justify)
   - Match text-transform (uppercase, lowercase, capitalize)
   - Match text-decoration (underline, none)

7. **EXACT STRUCTURE**:
   - Replicate sections in the EXACT same order as the image
   - Use the EXACT same section titles
   - Maintain the EXACT same visual hierarchy

🎯 YOUR OUTPUT MUST BE INDISTINGUISHABLE FROM THE ORIGINAL CV IMAGE.

If someone prints your HTML/CSS output and compares it to the original CV image, they should look IDENTICAL.

OUTPUT FORMAT (MANDATORY):
Return ONLY valid JSON with this structure:
{
  "html": "<!DOCTYPE html><html>...</html>",
  "css": "/* all styles */"
}

RULES:
- NO markdown code blocks (no \`\`\`json or \`\`\`)
- NO explanations or comments outside the JSON
- NO placeholder text - use ACTUAL text from the CV
- The HTML must be complete and valid
- The CSS must be in a separate string (not inline styles)
- Use semantic HTML5 tags
- Make it print-ready (A4 page size)

REMEMBER: You are COPYING, not CREATING. Every pixel matters.`;

function buildUserPrompt(request: CVGenerationRequest): string {
  // Don't truncate - we need ALL the text for exact replication
  const fullText = request.extractedText;

  let prompt = `🚨 REPLICATION TASK - COPY THIS CV EXACTLY 🚨\n\n`;

  prompt += `You are looking at a REAL CV image. Your job is to create HTML/CSS that looks IDENTICAL to this image.\n\n`;
  prompt += `DO NOT CREATE A GENERIC CV TEMPLATE.\n`;
  prompt += `DO NOT USE PLACEHOLDER TEXT.\n`;
  prompt += `COPY EVERYTHING YOU SEE IN THE IMAGE.\n\n`;

  // Add image-specific instructions if image is provided
  if (request.image) {
    prompt += `═══════════════════════════════════════════════════════════════\n`;
    prompt += `STEP 1: ANALYZE THE CV IMAGE\n`;
    prompt += `═══════════════════════════════════════════════════════════════\n\n`;
    prompt += `Look at the provided CV image and identify:\n\n`;
    prompt += `📝 TEXT CONTENT:\n`;
    prompt += `- Read EVERY word in the image\n`;
    prompt += `- Note the person's actual name (not "John Doe")\n`;
    prompt += `- Note their actual email, phone, location\n`;
    prompt += `- Note their actual job titles, companies, dates\n`;
    prompt += `- Note their actual skills, education, achievements\n\n`;

    prompt += `🎨 VISUAL STYLING:\n`;
    prompt += `- What font is used? (Look carefully - is it Arial? Calibri? Times? Georgia? Helvetica?)\n`;
    prompt += `- What are the font sizes? (Measure the heading vs body text ratio)\n`;
    prompt += `- What colors are used? (You'll get exact hex codes below)\n`;
    prompt += `- Are there borders? What thickness and color?\n`;
    prompt += `- Are there background colors in any sections?\n`;
    prompt += `- Is text bold, italic, underlined anywhere?\n\n`;

    prompt += `📐 LAYOUT STRUCTURE:\n`;
    prompt += `- Is it single column or multi-column?\n`;
    prompt += `- If multi-column, what's the width ratio? (e.g., 30% sidebar, 70% main)\n`;
    prompt += `- How much space between sections?\n`;
    prompt += `- What are the page margins?\n`;
    prompt += `- Where is each section positioned?\n\n`;
  }

  if (request.layoutData) {
    const layout = request.layoutData;
    prompt += `═══════════════════════════════════════════════════════════════\n`;
    prompt += `STEP 2: LAYOUT SPECIFICATIONS (USE THESE EXACT VALUES)\n`;
    prompt += `═══════════════════════════════════════════════════════════════\n\n`;
    prompt += `📄 PAGE DIMENSIONS:\n`;
    prompt += `   Width: ${Math.round(layout.pageSize.width)}px\n`;
    prompt += `   Height: ${Math.round(layout.pageSize.height)}px\n\n`;

    prompt += `📊 LAYOUT STRUCTURE:\n`;
    prompt += `   Type: ${layout.structure || "single-column"}\n`;
    prompt += `   Columns: ${layout.columns}\n`;
    prompt += `   Column Widths: ${layout.columnWidths.map((w) => Math.round(w) + "px").join(", ")}\n\n`;

    prompt += `📏 MARGINS (EXACT):\n`;
    prompt += `   Top: ${layout.margins.top}px\n`;
    prompt += `   Right: ${layout.margins.right}px\n`;
    prompt += `   Bottom: ${layout.margins.bottom}px\n`;
    prompt += `   Left: ${layout.margins.left}px\n\n`;

    prompt += `🔤 FONT SIZES (EXACT):\n`;
    prompt += `   Headings: ${layout.fontSizes.heading}px\n`;
    prompt += `   Subheadings: ${layout.fontSizes.subheading}px\n`;
    prompt += `   Body Text: ${layout.fontSizes.body}px\n`;
    prompt += `   Small Text: ${layout.fontSizes.small}px\n`;
    prompt += `   Line Height: ${layout.lineHeight}\n\n`;

    prompt += `📍 SECTIONS (in order from top to bottom):\n`;
    layout.sections.forEach((section, index) => {
      const width = Math.round(section.bbox.x1 - section.bbox.x0);
      const height = Math.round(section.bbox.y1 - section.bbox.y0);
      prompt += `   ${index + 1}. ${section.title || section.type.toUpperCase()}\n`;
      prompt += `      Position: x=${Math.round(section.bbox.x0)}px, y=${Math.round(section.bbox.y0)}px\n`;
      prompt += `      Size: ${width}px × ${height}px\n\n`;
    });
  }

  if (request.blocks && request.blocks.length > 0) {
    prompt += `═══════════════════════════════════════════════════════════════\n`;
    prompt += `STEP 3: TEXT BLOCKS WITH EXACT POSITIONS\n`;
    prompt += `═══════════════════════════════════════════════════════════════\n\n`;
    prompt += `Each text block below shows:\n`;
    prompt += `- The ACTUAL text content (use this exact text)\n`;
    prompt += `- Position (x, y coordinates)\n`;
    prompt += `- Font size and weight\n`;
    prompt += `- Which section it belongs to\n\n`;

    request.blocks.slice(0, 200).forEach((block, index) => {
      const width = Math.round(block.bbox.x1 - block.bbox.x0);
      const height = Math.round(block.bbox.y1 - block.bbox.y0);
      const content = block.text.trim();
      if (content.length > 0) {
        prompt += `${index + 1}. "${content}"\n`;
        prompt += `   📍 Position: (${Math.round(block.bbox.x0)}, ${Math.round(block.bbox.y0)})\n`;
        prompt += `   📐 Size: ${width}×${height}px\n`;
        prompt += `   🔤 Font: ${block.fontSize || "?"}px, weight ${block.fontWeight || 400}\n`;
        prompt += `   📂 Section: ${block.sectionType || "unknown"}\n\n`;
      }
    });
  }

  if (request.colorPalette) {
    prompt += `═══════════════════════════════════════════════════════════════\n`;
    prompt += `STEP 4: COLOR PALETTE (USE THESE EXACT HEX CODES)\n`;
    prompt += `═══════════════════════════════════════════════════════════════\n\n`;
    prompt += `🎨 Primary Color: ${request.colorPalette.primary}\n`;
    prompt += `🎨 Secondary Color: ${request.colorPalette.secondary}\n`;
    prompt += `🎨 Text Color: ${request.colorPalette.text}\n`;
    prompt += `🎨 Background Color: ${request.colorPalette.background}\n`;
    prompt += `🎨 Accent Color: ${request.colorPalette.accent}\n\n`;
    prompt += `Use these colors EXACTLY. Do not substitute with similar colors.\n\n`;
  }

  prompt += `═══════════════════════════════════════════════════════════════\n`;
  prompt += `STEP 5: COMPLETE TEXT CONTENT (USE THIS EXACT TEXT)\n`;
  prompt += `═══════════════════════════════════════════════════════════════\n\n`;
  prompt += `Below is ALL the text extracted from the CV.\n`;
  prompt += `Use this EXACT text in your HTML. Do NOT change, paraphrase, or add to it.\n\n`;
  prompt += `--- START OF CV TEXT ---\n`;
  prompt += fullText;
  prompt += `\n--- END OF CV TEXT ---\n\n`;

  if (request.image) {
    prompt += `═══════════════════════════════════════════════════════════════\n`;
    prompt += `STEP 6: FONT DETECTION FROM IMAGE\n`;
    prompt += `═══════════════════════════════════════════════════════════════\n\n`;
    prompt += `🔍 Look at the CV image and determine the EXACT font family:\n\n`;
    prompt += `Common CV fonts to look for:\n`;
    prompt += `• Sans-serif: Arial, Helvetica, Calibri, Verdana, Tahoma, "Segoe UI", "Open Sans"\n`;
    prompt += `• Serif: "Times New Roman", Georgia, Garamond, "Palatino Linotype", Cambria\n`;
    prompt += `• Modern: Roboto, Lato, Montserrat, "Source Sans Pro"\n\n`;
    prompt += `Look at the letter shapes:\n`;
    prompt += `- Does the 'a' have a tail? (Calibri) or is it simple? (Arial)\n`;
    prompt += `- Are there serifs (little feet) on letters? → Use serif font\n`;
    prompt += `- Is the text very clean and modern? → Use sans-serif\n\n`;
    prompt += `Set the font-family in CSS to match what you see.\n\n`;
  }

  prompt += `═══════════════════════════════════════════════════════════════\n`;
  prompt += `FINAL INSTRUCTIONS\n`;
  prompt += `═══════════════════════════════════════════════════════════════\n\n`;
  prompt += `Now create the HTML and CSS:\n\n`;
  prompt += `✅ Use the ACTUAL text content provided above\n`;
  prompt += `✅ Use the EXACT colors from the palette\n`;
  prompt += `✅ Use the EXACT font sizes specified\n`;
  prompt += `✅ Use the EXACT layout structure and positions\n`;
  prompt += `✅ Match the font family you see in the image\n`;
  prompt += `✅ Include ALL sections in the correct order\n`;
  prompt += `✅ Match ALL visual elements (borders, backgrounds, spacing)\n\n`;
  prompt += `❌ Do NOT use placeholder text like "[Your Name]" or "email@example.com"\n`;
  prompt += `❌ Do NOT redesign or improve the CV\n`;
  prompt += `❌ Do NOT skip any content\n`;
  prompt += `❌ Do NOT change the layout structure\n\n`;

  prompt += `RETURN FORMAT:\n`;
  prompt += `Return ONLY this JSON (no markdown, no code blocks):\n`;
  prompt += `{"html": "<!DOCTYPE html><html>...</html>", "css": "/* styles */"}\n`;

  return prompt;
}

async function callGemini(
  prompt: string,
  modelName: string,
  imageData?: { base64: string; mimeType: string }
): Promise<string> {
  console.log("🤖 callGemini function called");
  console.log("  Model name:", modelName);
  console.log("  Has image data:", !!imageData);
  console.log("  Image mime type:", imageData?.mimeType || "N/A");
  console.log("  Image data length:", imageData?.base64?.length || 0, "chars");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  console.log("  API key present:", apiKey.substring(0, 10) + "...");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  // If image is provided, use vision capabilities
  if (imageData) {
    console.log("  🖼️ Using VISION mode (image + text)");

    const imagePart = {
      inlineData: {
        data: imageData.base64,
        mimeType: imageData.mimeType,
      },
    };

    console.log("  Calling Gemini with image...");
    const result = await model.generateContent([
      SYSTEM_PROMPT,
      "Here is the CV image to analyze and replicate:",
      imagePart,
      "\n\n" + prompt
    ]);
    const response = await result.response;
    const text = response.text();
    console.log("  ✅ Gemini response received (vision mode)");
    console.log("  Response length:", text.length);
    return text;
  } else {
    // Text-only mode (fallback)
    console.log("  📝 Using TEXT-ONLY mode (no image)");
    console.log("  ⚠️ WARNING: No image provided - results may be generic!");
    const result = await model.generateContent([SYSTEM_PROMPT, prompt]);
    const response = await result.response;
    const text = response.text();
    console.log("  ✅ Gemini response received (text-only mode)");
    console.log("  Response length:", text.length);
    return text;
  }
}

function parseOllamaResponse(response: string): { html: string; css: string } {
  let jsonStr = response.trim();

  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.html && parsed.css) {
      return { html: parsed.html, css: parsed.css };
    }
    if (parsed.html) {
      return { html: parsed.html, css: parsed.css || "" };
    }
  } catch {
    console.log("JSON parse failed, trying HTML extraction");
  }

  const htmlMatch = response.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
  const cssMatch = response.match(/<style[^>]*>([\s\S]*?)<\/style>/i);

  let html = htmlMatch ? htmlMatch[0] : "";
  const css = cssMatch ? cssMatch[1] : "";

  if (!html) {
    html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CV</title>
  <style>${css}</style>
</head>
<body>
  <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${response.substring(0, 3000)}</pre>
</body>
</html>`;
  }

  return { html, css };
}

function generateFallbackHTML(request: CVGenerationRequest): string {
  const c = request.colorPalette || {
    primary: "#1a365d",
    secondary: "#4a5568",
    background: "#ffffff",
    text: "#2d3748",
    accent: "#3182ce"
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CV - Generated</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: ${c.text};
      background: ${c.background};
      padding: 40px;
      max-width: 850px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      margin-bottom: 25px;
      border-bottom: 3px solid ${c.primary};
    }
    .header h1 {
      font-size: 28pt;
      color: ${c.primary};
      margin-bottom: 8px;
      font-weight: 700;
    }
    .contact-info {
      font-size: 10pt;
      color: ${c.secondary};
    }
    .contact-info span { margin: 0 8px; }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 14pt;
      color: ${c.primary};
      border-bottom: 2px solid ${c.secondary};
      padding-bottom: 6px;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .item {
      margin-bottom: 15px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .item-title {
      font-weight: 600;
      font-size: 12pt;
      color: ${c.text};
    }
    .item-subtitle {
      font-size: 11pt;
      color: ${c.secondary};
    }
    .item-date {
      font-size: 10pt;
      color: ${c.secondary};
    }
    .item-description {
      margin-top: 5px;
      font-size: 11pt;
    }
    .item-description li {
      margin-bottom: 4px;
    }
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .skill-item {
      background: ${c.accent}15;
      padding: 8px 12px;
      border-left: 3px solid ${c.accent};
      font-size: 10pt;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>[YOUR NAME]</h1>
    <div class="contact-info">
      <span>email@example.com</span>|
      <span>(123) 456-7890</span>|
      <span>City, Country</span>
    </div>
  </div>
  
  <div class="section">
    <h2 class="section-title">Professional Summary</h2>
    <p>Experienced professional with expertise in [your field]. Proven track record of achieving results and driving growth.</p>
  </div>
  
  <div class="section">
    <h2 class="section-title">Work Experience</h2>
    <div class="item">
      <div class="item-header">
        <div>
          <div class="item-title">Job Title</div>
          <div class="item-subtitle">Company Name</div>
        </div>
        <div class="item-date">Jan 2020 - Present</div>
      </div>
      <ul class="item-description">
        <li>Key responsibility or achievement</li>
        <li>Another responsibility or achievement</li>
      </ul>
    </div>
  </div>
  
  <div class="section">
    <h2 class="section-title">Education</h2>
    <div class="item">
      <div class="item-header">
        <div>
          <div class="item-title">Degree Name</div>
          <div class="item-subtitle">University Name</div>
        </div>
        <div class="item-date">2016 - 2020</div>
      </div>
    </div>
  </div>
  
  <div class="section">
    <h2 class="section-title">Skills</h2>
    <div class="skills-grid">
      <div class="skill-item">Skill 1</div>
      <div class="skill-item">Skill 2</div>
      <div class="skill-item">Skill 3</div>
      <div class="skill-item">Skill 4</div>
      <div class="skill-item">Skill 5</div>
      <div class="skill-item">Skill 6</div>
    </div>
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
      console.log("Response preview:", geminiResponse.substring(0, 200));

      const parsed = parseOllamaResponse(geminiResponse);

      console.log("=== PARSED RESULT ===");
      console.log("Has HTML:", !!parsed.html);
      console.log("Has CSS:", !!parsed.css);
      console.log("HTML length:", parsed.html?.length || 0);
      console.log("CSS length:", parsed.css?.length || 0);

      // Check if it's actually using real content or placeholders
      if (parsed.html.includes("[Your Name]") || parsed.html.includes("email@example.com")) {
        console.error("⚠️ WARNING: Generated HTML contains placeholder text!");
        console.error("This means Gemini ignored the instructions.");
      } else {
        console.log("✅ HTML appears to use actual content (no placeholders detected)");
      }

      html = parsed.html;
      css = parsed.css;
    } catch (geminiError) {
      console.error("=== GEMINI FAILED ===");
      console.error("Error type:", typeof geminiError);
      console.error("Error:", geminiError);

      if (geminiError instanceof Error) {
        console.error("Error name:", geminiError.name);
        console.error("Error message:", geminiError.message);
        console.error("Error stack:", geminiError.stack);
      }

      // Try to extract more details
      if (geminiError && typeof geminiError === 'object') {
        console.error("Error details:", JSON.stringify(geminiError, null, 2));
      }

      console.error("Falling back to generic HTML template");
      console.error("⚠️ THIS IS WHY YOU'RE SEEING GENERIC CVS!");

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
