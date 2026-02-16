# Module 1 Setup Guide - Document Upload & Text Extraction

## Overview

**Module 1** implements the core upload functionality with text extraction from various document formats. This module transforms the placeholder upload page into a fully functional drag-and-drop interface that extracts text from:
- **Images** (PNG, JPG, JPEG, WEBP) using OCR with Tesseract.js
- **PDF Documents** using pdf.js
- **Word Documents** (DOCX) using mammoth

All processing happens entirely in the browser - no server required!

### What You'll Learn
- How to implement drag-and-drop file upload
- How to implement click-to-browse file upload
- How to create image/document previews
- How to perform OCR with Tesseract.js
- How to parse PDF documents with pdf.js
- How to parse Word documents with mammoth
- How to handle file validation and errors
- How to---

## Prerequisites

 build progress indicators

Before starting Module 1, ensure you have:
- ✅ Completed Module 0 (project setup)
- ✅ Node.js 18+ installed
- ✅ Basic understanding of React hooks
- ✅ Familiarity with TypeScript

---

## Quick Start

### 1. Install Required Libraries

```bash
cd cv-generator
npm install tesseract.js pdfjs-dist mammoth
```

**Library Purposes:**

| Library | Purpose |
|---------|---------|
| **tesseract.js** | OCR for extracting text from images (free, client-side) |
| **pdfjs-dist** | Parse PDF documents and extract text |
| **mammoth** | Parse Word (.docx) documents and extract text |

### 2. Start Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000/upload` to see the upload page.

---

## Module Structure

```
src/
├── app/
│   └── upload/
│       └── page.tsx              # Main upload page (UPDATED)
├── components/
│   └── upload/
│       ├── DropZone.tsx          # Drag & drop + click component (UPDATED)
│       ├── ImagePreview.tsx      # Image/document preview (UPDATED)
│       └── UploadProgress.tsx   # Progress indicator
├── lib/
│   └── services/
│       ├── ocrService.ts         # OCR logic for images
│       └── documentService.ts    # NEW: PDF/DOCX parsing logic
└── types/
    └── index.ts                  # Types (already from Module 0)
```

---

## New Features Added

### 1. Click-to-Upload
The DropZone now supports both drag-and-drop AND click-to-browse functionality:
- Click anywhere on the dropzone to open the file browser
- Keyboard accessible (Enter/Space to activate)
- Visual feedback on hover and click

### 2. Document Support
The upload system now accepts three file types:

| File Type | Extension | Processing Method | Preview |
|-----------|-----------|-------------------|---------|
| Images | PNG, JPG, JPEG, WEBP | Tesseract.js OCR | Full image preview |
| PDF | .pdf | pdf.js text extraction | Document icon |
| Word | .docx | mammoth text extraction | Document icon |

---

## Component Details

### 1. DropZone Component
**Location:** `src/components/upload/DropZone.tsx`

**Features:**
- Drag and drop file selection
- Click to browse files (NEW)
- File validation (type & size)
- Visual feedback during drag
- Error messages
- Keyboard accessible
- Supports images, PDF, and DOCX

**Key Props:**
```typescript
interface DropZoneProps {
  onFileSelect: (file: File) => void;  // Called when valid file selected
  accept?: string;                       // Accepted MIME types (updated)
  maxSize?: number;                      // Max file size in bytes
  disabled?: boolean;                    // Disable interaction
}
```

**Accepted File Types:**
```typescript
const DEFAULT_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx";
```

---

### 2. ImagePreview Component
**Location:** `src/components/upload/ImagePreview.tsx`

**Features (Updated):**
- Displays uploaded image preview (for images)
- Shows document icon (for PDF/DOCX)
- Shows file metadata (name, size, type)
- Remove button
- Zoom modal for images (NEW)
- Loading skeleton
- Error handling for failed loads

**Key Updates:**
- Now imports `getFileTypeDescription` from documentService
- Shows different icons for different file types
- Document files show a document icon instead of image preview

---

### 3. UploadProgress Component
**Location:** `src/components/upload/UploadProgress.tsx`

**Features:**
- Animated progress bar
- Status messages
- Three states: processing, completed, error
- Cancel button (during processing)
- Success/error messages

---

### 4. OCR Service
**Location:** `src/lib/services/ocrService.ts`

**Main Functions:**

#### `performOCR()`
Extracts text from an image with full details.

```typescript
const result = await performOCR(file, {
  logger: (progress) => {
    console.log(`${progress.status}: ${progress.progress}%`);
  }
});

console.log(result.fullText);      // All extracted text
console.log(result.confidence);    // Average confidence (0-100)
console.log(result.blocks);        // Individual text blocks with positions
console.log(result.processingTime); // Time in ms
```

---

### 5. Document Service (NEW)
**Location:** `src/lib/services/documentService.ts`

**Main Functions:**

#### `parseDocument()`
Extracts text from PDF or DOCX files.

```typescript
const result = await parseDocument(file, {
  onProgress: (progress) => {
    console.log(`${progress.status}: ${progress.progress}%`);
  }
});

console.log(result.fullText);       // All extracted text
console.log(result.pageCount);      // Number of pages/sections
console.log(result.processingTime); // Time in ms
console.log(result.fileType);        // "pdf" or "docx"
console.log(result.success);        // Boolean
```

#### `getFileType()`
Determines the file type from a File object.

```typescript
const type = getFileType(file);
// Returns: "image", "pdf", "docx", or null
```

#### `getFileTypeDescription()`
Gets a human-readable description.

```typescript
const description = getFileTypeDescription(file);
// Returns: "PDF Document", "Word Document", or "Image"
```

#### `needsOCR()`
Checks if a file needs OCR processing.

```typescript
const needsOcr = needsOCR(file);
// Returns: true for images, false for PDF/DOCX
```

---

## Upload Page Flow

The upload page has 5 states managed by the `pageState` variable:

### 1. Idle State
- Shows DropZone component
- User can drag & drop or click to select file
- Shows informational cards about the process

### 2. Preview State
- Shows ImagePreview of selected file
- For images: Shows full image preview
- For documents: Shows document icon
- Displays "Extract Text" or "Extract Text with AI" button
- Shows file type badge
- Shows "Choose Different File" button

### 3. Processing State
- Shows UploadProgress with real-time updates
- For images: Tesseract.js processes the image
- For documents: pdf.js or mammoth processes the document
- Progress bar updates as processing runs
- Cancel button available

### 4. Completed State
- Shows success message
- Displays extraction statistics (confidence, blocks, time)
- Preview of extracted text
- "Continue to Editor" button
- "Upload Another" button

### 5. Error State
- Shows error message
- Retry button
- Troubleshooting tips
- Option to upload different file

---

## File Validation

The upload system validates files with these rules:

### Accepted File Types

#### Images
- `image/png` - Best quality, supports transparency
- `image/jpeg` or `image/jpg` - Compressed, widely used
- `image/webp` - Modern format, good compression

#### Documents (NEW)
- `application/pdf` - PDF documents
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` - DOCX

### File Size Limit
- Maximum: 10MB
- Prevents browser memory issues
- Large files are slow to process

### Validation Errors
- **Invalid type**: "Invalid file type. Please upload an image (PNG, JPG, WEBP), PDF, or Word document (DOCX)."
- **Too large**: "File too large. Maximum size is 10MB."

---

## Processing Performance

### Images (OCR)
- **First Run**: Downloads language data (~10MB), takes 10-30 seconds
- **Subsequent Runs**: 5-15 seconds typical
- Uses cached language data

### PDF Documents
- **Processing Time**: 2-10 seconds depending on length
- Extracts text from all pages
- No external downloads needed

### Word Documents
- **Processing Time**: 1-5 seconds
- Extracts raw text from document
- No external downloads needed

## Performance & Optimization

To ensure fast initial load times, we implemented **Code Splitting** for heavy libraries:

### 1. Dynamic Imports
Instead of importing heavy libraries like `tesseract.js`, `pdfjs-dist`, and `mammoth` at the top level, we import them dynamically only when needed.

**Example (ocrService.ts):**
```typescript
// Old (Slow): Top-level import
// import Tesseract from "tesseract.js";

// New (Fast): Dynamic import inside function
export const performOCR = async (...) => {
  const Tesseract = await import("tesseract.js");
  // ... use Tesseract
};
```

**Benefits:**
- **Smaller Initial Bundle**: The main application loads much faster because it doesn't wait for large OCR/PDF libraries.
- **On-Demand Loading**: Heavy code is only downloaded when the user actually clicks "Extract Text".
- **Better UX**: The UI is responsive immediately.

---

## State Management

The upload page uses Zustand for global state:

### Upload State (in `useAppStore`)
```typescript
interface UploadState {
  file: File | null;        // The selected file
  preview: string | null;   // Object URL for preview
  isUploading: boolean;    // Upload in progress
  progress: number;         // Upload progress
  error: string | null;     // Error message
}
```

### Additional State in Upload Page
```typescript
// File type tracking
const [fileType, setFileType] = useState<string>("image");

// OCR result (for images)
const [ocrResult, setOcrResult] = useState<OCRServiceResult | null>(null);

// Document result (for PDF/DOCX)
const [documentResult, setDocumentResult] = useState<DocumentParseResult | null>(null);
```

---

## Testing the Upload Flow

### Test Case 1: Image Upload (Drag & Drop)
1. Navigate to `/upload`
2. Drag a clear CV image into the dropzone
3. Verify image preview appears
4. Click "Extract Text with AI"
5. Wait for processing
6. Verify text is extracted

### Test Case 2: Image Upload (Click)
1. Navigate to `/upload`
2. Click on the dropzone area
3. Select a file from the file browser
4. Verify image preview appears

### Test Case 3: PDF Upload
1. Navigate to `/upload`
2. Drag a PDF file into the dropzone
3. Verify document icon appears (not image preview)
4. Click "Extract Text"
5. Wait for processing
6. Verify text is extracted

### Test Case 4: Word Document Upload
1. Navigate to `/upload`
2. Drag a DOCX file into the dropzone
3. Verify document icon appears
4. Click "Extract Text"
5. Wait for processing
6. Verify text is extracted

### Test Case 5: Invalid File Type
1. Try to upload a file that's not an image, PDF, or DOCX
2. Verify error message appears
3. Verify file is rejected

### Test Case 6: Large File
1. Try to upload a file >10MB
2. Verify size error appears
3. Verify file is rejected

---

## Common Issues & Solutions

### Issue: PDF Not Loading
**Solution:**
- Ensure the PDF is not password-protected
- Try a different PDF file
- Check browser console for errors

### Issue: Word Document Not Parsing
**Solution:**
- Ensure the file is .docx format (not .doc)
- Try a different Word document
- Check browser console for errors

### Issue: OCR Taking Too Long
**Solution:**
- Reduce image resolution
- Convert to PNG for faster processing
- Ensure image <5MB

### Issue: Low Confidence Scores
**Solution:**
- Use clearer images
- Ensure good lighting
- Avoid skewed/rotated images

### Issue: Tesseract Not Loading
**Solution:**
- Check internet connection (first run needs download)
- Clear browser cache
- Check browser console for errors

---

## Dependencies Added

### Core Dependencies
```bash
npm install tesseract.js pdfjs-dist mammoth
```

### Version Information
- tesseract.js: ^7.0.0
- pdfjs-dist: (latest)
- mammoth: (latest)

---

## Next Steps

After completing Module 1:
1. Test with various file types (images, PDF, DOCX)
2. Check text extraction accuracy
3. Gather feedback on user experience
4. Move to Module 2: CV Structure Extraction

Module 2 will:
- Parse extracted text into structured CV data
- Identify sections (Experience, Education, Skills)
- Extract specific fields (name, email, etc.)
- Create editable CV structure

---

## File Summary

### New Files Created (1)
1. `src/lib/services/documentService.ts` - Document parsing logic

### Modified Files (4)
1. `src/components/upload/DropZone.tsx` - Added click support + document types
2. `src/components/upload/ImagePreview.tsx` - Added document preview support
3. `src/app/upload/page.tsx` - Added document handling flow
4. `MODULE_1_SETUP_GUIDE.md` - This guide (updated)

### Dependencies Added (3)
1. `tesseract.js` - OCR library (existing)
2. `pdfjs-dist` - PDF parsing (NEW)
3. `mammoth` - Word document parsing (NEW)

---

## Browser Compatibility

All libraries work in all modern browsers:
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

**Requirements:**
- WebAssembly support (all modern browsers)
- ~100MB free memory for OCR

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify file meets requirements
3. Try a different file
4. Check respective library docs:
   - Tesseract.js: https://github.com/naptha/tesseract.js
   - PDF.js: https://mozilla.github.io/pdf.js/
   - Mammoth: https://github.com/mammothjs/mammoth.js

---

**Congratulations!** You now have a fully functional document upload and text extraction system. Your users can upload images, PDF, or Word documents and extract text completely free!
