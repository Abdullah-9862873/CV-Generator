import { OCRResult } from "@/types";

export interface OCRProgress {
  status: string;
  progress: number;
}

export interface OCRServiceResult {
  fullText: string;
  blocks: OCRResult[];
  confidence: number;
  processingTime: number;
}

export interface OCROptions {
  language?: string;
  logger?: (progress: OCRProgress) => void;
  errorHandler?: (error: Error) => void;
}

interface TesseractWord {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

interface TesseractLoggerMessage {
  status: string;
  progress: number;
}

interface TesseractLine {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

interface TesseractResultData {
  text: string;
  words?: TesseractWord[];
  lines?: TesseractLine[];
}

interface TesseractRecognitionResult {
  data: TesseractResultData;
}

const DEFAULT_OPTIONS: OCROptions = {
  language: "eng",
};

const MIN_CONFIDENCE_THRESHOLD = 60;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
};

const calculateAverageConfidence = (blocks: OCRResult[]): number => {
  if (blocks.length === 0) return 0;

  const sum = blocks.reduce((acc, block) => acc + block.confidence, 0);
  return Math.round(sum / blocks.length);
};

const getLowConfidenceBlocks = (blocks: OCRResult[]): OCRResult[] => {
  return blocks.filter((block) => block.confidence < MIN_CONFIDENCE_THRESHOLD);
};

export const performOCR = async (
  imageFile: File,
  options: OCROptions = {}
): Promise<OCRServiceResult> => {
  const startTime = Date.now();
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  console.log("Starting OCR on file:", imageFile.name, "type:", imageFile.type, "size:", imageFile.size);

  try {
    const imageData = await fileToBase64(imageFile);
    console.log("Image converted to base64, length:", imageData.length);
    
    const Tesseract = await import("tesseract.js");
    console.log("Tesseract loaded, starting recognition...");

    const result = await Tesseract.default.recognize(
      imageData,
      mergedOptions.language || "eng",
      {
        logger: (m: TesseractLoggerMessage) => {
          if (mergedOptions.logger) {
            mergedOptions.logger({
              status: m.status,
              progress: Math.round(m.progress * 100),
            });
          }
        },
      }
    ) as TesseractRecognitionResult;

    console.log("Tesseract recognition complete");
    console.log("Result text length:", result.data.text?.length || 0);
    console.log("Result text preview:", result.data.text?.substring(0, 120));
    console.log("Result data keys:", Object.keys(result.data || {}));
    console.log(
      "Word count:",
      result.data.words?.length || 0,
      "Line count:",
      result.data.lines?.length || 0
    );

    const fullText = result.data.text || "";
    const words = result.data.words || [];
    const lines = result.data.lines || [];
    let blocks: OCRResult[] = [];

    if (words.length > 0) {
      blocks = words.map((word: TesseractWord) => ({
        text: word.text || "",
        confidence: word.confidence || 0,
        bbox: {
          x0: word.bbox?.x0 || 0,
          y0: word.bbox?.y0 || 0,
          x1: word.bbox?.x1 || 0,
          y1: word.bbox?.y1 || 0,
        },
      }));
    } else if (lines.length > 0) {
      blocks = lines.map((line: TesseractLine, index) => ({
        text: line.text || `line_${index}`,
        confidence: line.confidence || 0,
        bbox: {
          x0: line.bbox?.x0 || 0,
          y0: line.bbox?.y0 || 0,
          x1: line.bbox?.x1 || 0,
          y1: line.bbox?.y1 || 0,
        },
      }));
      console.log("Generated blocks from line data");
    }

    if (blocks.length === 0 && fullText.length > 0) {
      blocks = [{
        text: fullText,
        confidence: 80,
        bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
      }];
      console.warn("Fallback to single block from full text");
    }

    const processingTime = Date.now() - startTime;
    const confidence = calculateAverageConfidence(blocks);

    console.log(`OCR completed in ${processingTime}ms`);
    console.log(`Extracted ${blocks.length} text blocks`);
    console.log(`Average confidence: ${confidence}%`);

    const lowConfidenceBlocks = getLowConfidenceBlocks(blocks);
    if (lowConfidenceBlocks.length > 0) {
      console.warn(
        `${lowConfidenceBlocks.length} blocks have low confidence and may need review`
      );
    }

    return {
      fullText,
      blocks,
      confidence,
      processingTime,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error("OCR Error:", error.message);

      if (mergedOptions.errorHandler) {
        mergedOptions.errorHandler(error);
      }

      throw error;
    }

    const unknownError = new Error("Unknown error during OCR processing");
    console.error("OCR Error:", unknownError);
    throw unknownError;
  }
};

export const extractText = async (
  imageFile: File,
  options: OCROptions = {}
): Promise<string> => {
  const result = await performOCR(imageFile, options);
  return result.fullText;
};

export const checkOCRReady = async (): Promise<boolean> => {
  try {
    const Tesseract = await import("tesseract.js");
    await Tesseract.default.createWorker("eng");
    return true;
  } catch (error) {
    console.error("Tesseract initialization failed:", error);
    return false;
  }
};

export const OCRService = {
  performOCR,
  extractText,
  checkOCRReady,
};

export default OCRService;
