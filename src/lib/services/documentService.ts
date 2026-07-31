
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export interface DocumentParseResult {
  fullText: string;
  pageCount: number;
  processingTime: number;
  fileName: string;
  fileType: "pdf" | "docx";
  success: boolean;
  error?: string;
}

export interface DocumentParseProgress {
  status: string;
  progress: number;
}

export interface DocumentParseOptions {
  onProgress?: (progress: DocumentParseProgress) => void;
}

export type SupportedFileType = "pdf" | "docx" | "image";

export function getFileType(file: File): SupportedFileType | null {
  const fileName = file.name.toLowerCase();
  const fileType = file.type;

  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    return "pdf";
  }

  if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    return "docx";
  }

  if (fileType.startsWith("image/") ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".webp")) {
    return "image";
  }

  return null;
}

async function extractTextFromPdf(
  file: File,
  onProgress?: (progress: DocumentParseProgress) => void
): Promise<string> {
  if (!isBrowser()) {
    throw new Error("PDF parsing is only available in browser environment");
  }

  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();

  onProgress?.({
    status: "Loading PDF document...",
    progress: 10,
  });

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  let fullText = "";

  for (let i = 1; i <= numPages; i++) {
    onProgress?.({
      status: `Extracting text from page ${i} of ${numPages}...`,
      progress: 10 + Math.round((i / numPages) * 80),
    });

    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => item.str)
      .join(" ");

    fullText += pageText + "\n\n";
  }

  onProgress?.({
    status: "PDF text extraction complete",
    progress: 100,
  });

  return fullText.trim();
}

async function extractTextFromDocx(
  file: File,
  onProgress?: (progress: DocumentParseProgress) => void
): Promise<string> {
  if (!isBrowser()) {
    throw new Error("Document parsing is only available in browser environment");
  }

  onProgress?.({
    status: "Loading Word document...",
    progress: 20,
  });

  const arrayBuffer = await file.arrayBuffer();

  onProgress?.({
    status: "Extracting text from Word document...",
    progress: 50,
  });

  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer });

  onProgress?.({
    status: "Word document text extraction complete",
    progress: 100,
  });

  return result.value;
}

export async function parseDocument(
  file: File,
  options: DocumentParseOptions = {}
): Promise<DocumentParseResult> {
  const startTime = Date.now();
  const { onProgress } = options;

  try {
    const fileType = getFileType(file);

    if (!fileType) {
      return {
        fullText: "",
        pageCount: 0,
        processingTime: Date.now() - startTime,
        fileName: file.name,
        fileType: "pdf",
        success: false,
        error: `Unsupported file type: ${file.type || file.name}`,
      };
    }

    let fullText = "";
    let pageCount = 0;

    onProgress?.({
      status: "Starting document parsing...",
      progress: 0,
    });

    switch (fileType) {
      case "pdf":
        fullText = await extractTextFromPdf(file, onProgress);
        pageCount = Math.ceil(fullText.split(/\n\n/).length / 10) || 1;
        break;

      case "docx":
        fullText = await extractTextFromDocx(file, onProgress);
        pageCount = Math.ceil(fullText.split(/\n\n/).length / 10) || 1;
        break;

      case "image":
        return {
          fullText: "",
          pageCount: 1,
          processingTime: Date.now() - startTime,
          fileName: file.name,
          fileType: "pdf",
          success: true,
          error: "USE_OCR",
        };

      default:
        return {
          fullText: "",
          pageCount: 0,
          processingTime: Date.now() - startTime,
          fileName: file.name,
          fileType: "pdf",
          success: false,
          error: "Unsupported file type",
        };
    }

    return {
      fullText,
      pageCount,
      processingTime: Date.now() - startTime,
      fileName: file.name,
      fileType: fileType || "pdf",
      success: true,
    };
  } catch (error) {
    console.error("Document parsing error:", error);
    return {
      fullText: "",
      pageCount: 0,
      processingTime: Date.now() - startTime,
      fileName: file.name,
      fileType: "pdf",
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse document",
    };
  }
}

export function needsOCR(file: File): boolean {
  const fileType = getFileType(file);
  return fileType === "image";
}

export function getFileTypeDescription(file: File): string {
  const fileType = getFileType(file);

  switch (fileType) {
    case "pdf":
      return "PDF Document";
    case "docx":
      return "Word Document";
    case "image":
      return "Image";
    default:
      return "Unknown File";
  }
}
