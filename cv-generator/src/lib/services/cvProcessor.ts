import { performOCR } from "./ocrService";
import { extractColorsFromImage } from "./colorExtractor";
import { getFullTextFromOCR, analyzeLayout, LayoutAnalysis } from "./layoutAnalyzer";
import { renderDeterministicCV } from "./layoutRenderer";
import { LayoutBlock } from "./layoutAnalyzer";

export interface CVProcessingResult {
  text: string;
  html: string;
  css: string;
  colorPalette: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  layout: LayoutAnalysis;
  blocks: LayoutBlock[];
  processingTime: number;
}

export interface ProcessingProgress {
  stage: "ocr" | "color" | "ai" | "complete";
  progress: number;
  message: string;
}

export type ProgressCallback = (progress: ProcessingProgress) => void;

const loadImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width || 1024, height: img.height || 1320 });
    img.onerror = () => reject(new Error("Failed to load image for layout analysis"));
    img.src = url;
  });
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export async function processCVFromImage(
  imageFile: File,
  onProgress?: ProgressCallback
): Promise<CVProcessingResult> {
  const startTime = Date.now();

  console.log("processCVFromImage called with:", imageFile.name, imageFile.type, imageFile.size);

  onProgress?.({ stage: "ocr", progress: 10, message: "Extracting text from CV..." });

  const imageUrl = URL.createObjectURL(imageFile);
  console.log("Created object URL:", imageUrl);

  try {
    console.log("Starting OCR...");
    const ocrData = await performOCR(imageFile, {
      logger: (p) => {
        console.log("OCR:", p.status, p.progress + "%");
        onProgress?.({
          stage: "ocr",
          progress: 10 + Math.round(p.progress * 0.3),
          message: `Reading text: ${Math.round(p.progress)}%`,
        });
      },
    });

    console.log("OCR Result - fullText length:", ocrData.fullText.length);
    console.log("OCR Result - blocks:", ocrData.blocks.length);

    const extractedText = getFullTextFromOCR(ocrData.blocks);
    console.log("Extracted text preview:", extractedText.substring(0, 100));

    if (!extractedText || extractedText.trim().length < 5) {
      throw new Error("No text could be extracted. Please try a clearer image or different format.");
    }

    onProgress?.({ stage: "color", progress: 40, message: "Analyzing colors..." });
    const colorPalette = await extractColorsFromImage(imageUrl);
    console.log("Extracted colors:", colorPalette);

    onProgress?.({ stage: "color", progress: 55, message: "Analyzing layout..." });
    let layout: LayoutAnalysis;
    try {
      const { width, height } = await loadImageDimensions(imageUrl);
      layout = analyzeLayout(ocrData.blocks, width || 1024, height || 1320);
    } catch (layoutError) {
      console.warn("Layout analysis failed, using defaults", layoutError);
      layout = analyzeLayout(ocrData.blocks, 1024, 1320);
    }
    console.log("Layout analysis:", layout);

    let html = "";
    let css = "";
    let usedAI = false;

    // Convert image to base64 for AI analysis
    let imageBase64 = "";
    try {
      imageBase64 = await fileToBase64(imageFile);
    } catch (e) {
      console.warn("Failed to convert image to base64", e);
    }

    const payload = {
      extractedText,
      image: imageBase64 ? {
        base64: imageBase64,
        mimeType: imageFile.type
      } : undefined,
      colorPalette: {
        primary: colorPalette.primary.hex,
        secondary: colorPalette.secondary.hex,
        background: colorPalette.background.hex,
        text: colorPalette.text.hex,
        accent: colorPalette.accent.hex,
      },
      layoutData: {
        columns: layout.columns,
        columnWidths: layout.columnWidths,
        fontSizes: layout.fontSizes,
        margins: layout.margins,
        lineHeight: layout.lineHeight,
        sections: layout.sections,
        pageSize: {
          width: layout.pageWidth,
          height: layout.pageHeight,
        },
        structure: layout.layout,
      },
      blocks: layout.blocks.slice(0, 200).map((block) => ({
        text: block.text,
        fontSize: block.fontSize,
        fontWeight: block.fontWeight,
        sectionType: block.sectionType,
        bbox: block.bbox,
      })),
    };

    onProgress?.({ stage: "ai", progress: 65, message: "Asking Gemini to recreate layout..." });

    try {
      console.log("📤 Sending request to /api/generate-cv");
      console.log("Payload size:", JSON.stringify(payload).length, "bytes");
      console.log("Has image in payload:", !!payload.image);

      const response = await fetch("/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("📥 Response status:", response.status, response.statusText);

      if (response.ok) {
        const aiResult = await response.json();
        console.log("AI Result:", {
          success: aiResult.success,
          hasHtml: !!aiResult.html,
          hasCSS: !!aiResult.css,
          modelUsed: aiResult.modelUsed,
          processingTime: aiResult.processingTime
        });

        if (aiResult.success && aiResult.html) {
          // Check if it's using placeholders
          if (aiResult.html.includes("[Your Name]") || aiResult.html.includes("email@example.com")) {
            console.error("⚠️ AI returned HTML with placeholder text - this should not happen!");
          } else {
            console.log("✅ AI returned HTML with actual content");
          }

          html = aiResult.html;
          css = aiResult.css;
          usedAI = true;
        } else {
          console.warn("❌ AI result not successful or missing HTML");
        }
      } else {
        const errorBody = await response.json().catch(() => ({}));
        console.error("❌ AI generation failed:", errorBody.error || response.statusText);
      }
    } catch (aiError) {
      console.error("❌ AI generation error:", aiError);
      console.error("Falling back to deterministic renderer");
    }

    if (!usedAI) {
      console.log("🔧 Using deterministic renderer (fallback)");
      const deterministic = renderDeterministicCV({
        blocks: layout.blocks,
        layout,
        colorPalette: {
          primary: colorPalette.primary.hex,
          secondary: colorPalette.secondary.hex,
          background: colorPalette.background.hex,
          text: colorPalette.text.hex,
          accent: colorPalette.accent.hex,
        },
        fullText: extractedText,
      });
      html = deterministic.html;
      css = deterministic.css;
    }

    onProgress?.({ stage: "complete", progress: 100, message: usedAI ? "Gemini replica ready" : "Replica generated" });

    return {
      text: extractedText,
      html,
      css,
      colorPalette: {
        primary: colorPalette.primary.hex,
        secondary: colorPalette.secondary.hex,
        background: colorPalette.background.hex,
        text: colorPalette.text.hex,
        accent: colorPalette.accent.hex,
      },
      layout,
      blocks: layout.blocks,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    URL.revokeObjectURL(imageUrl);
    throw error;
  }
}

export async function regenerateCV(
  extractedText: string,
  colorPalette: CVProcessingResult["colorPalette"],
  layout: LayoutAnalysis,
  blocks: LayoutBlock[]
): Promise<{ html: string; css: string }> {
  console.log("Regenerating CV with text length:", extractedText.length);

  const payload = {
    extractedText,
    colorPalette,
    layoutData: {
      columns: layout.columns,
      columnWidths: layout.columnWidths,
      fontSizes: layout.fontSizes,
      margins: layout.margins,
      lineHeight: layout.lineHeight,
      sections: layout.sections,
      pageSize: {
        width: layout.pageWidth,
        height: layout.pageHeight,
      },
      structure: layout.layout,
    },
    blocks: (blocks && blocks.length > 0 ? blocks : layout.blocks).slice(0, 200).map((block) => ({
      text: block.text,
      fontSize: block.fontSize,
      fontWeight: block.fontWeight,
      sectionType: block.sectionType,
      bbox: block.bbox,
    })),
  };

  try {
    const response = await fetch("/api/generate-cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const aiResult = await response.json();
      if (aiResult.success && aiResult.html) {
        return { html: aiResult.html, css: aiResult.css };
      }
    } else {
      console.warn("AI regeneration failed, using deterministic renderer");
    }
  } catch (error) {
    console.warn("AI regeneration error, using deterministic renderer", error);
  }

  return renderDeterministicCV({
    blocks: blocks && blocks.length > 0 ? blocks : layout.blocks,
    layout,
    colorPalette,
    fullText: extractedText,
  });
}

export const CVProcessor = {
  processCVFromImage,
  regenerateCV,
};

export default CVProcessor;
