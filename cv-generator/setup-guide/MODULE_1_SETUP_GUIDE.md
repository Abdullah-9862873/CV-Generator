# Module 1 Setup Guide · Document Upload & Extraction

## 1. Where We Started
Module 0 gave us a clean Next.js 14 + Tailwind base with global navigation and placeholder pages. Module 1 builds on that foundation and delivers a fully functional upload pipeline capable of reading CVs from **images, PDFs, and DOCX files** directly in the browser.

## 2. Goals of Module 1
- Provide a friendly drag‑and‑drop upload interface with keyboard support.
- Validate file types/sizes and show contextual errors.
- Preview the selected file (image preview or document card).
- Run extraction in the browser:
  - **Images** → `tesseract.js` OCR
  - **PDF** → `pdfjs-dist`
  - **DOCX** → `mammoth`
- Surface progress, success, and error states so users know what is happening.
- Persist the extracted text and metadata inside the Zustand store so later modules can use it.

## 3. Project Updates
```
src/
├── app/
│   └── upload/page.tsx        ← complete upload workflow
├── components/upload/
│   ├── DropZone.tsx           ← drag/drop + click-to-upload
│   ├── ImagePreview.tsx       ← previews + remove/reset actions
│   └── UploadProgress.tsx     ← animated progress + cancel
└── lib/services/
    ├── ocrService.ts          ← image OCR (dynamic import)
    └── documentService.ts     ← PDF/DOCX parsing helpers
```

## 4. Key Implementation Notes
- **Dynamic imports** keep the initial bundle small; heavy libraries download only when needed.
- **Upload state** (file, preview URL, progress, errors) lives in `useAppStore`, so the editor and other routes can access the same data later.
- **Page states** (`idle → preview → processing → success/error`) make the UX predictable.
- **Validation** rejects unsupported types or files >10 MB with clear error messages.

## 5. Testing Checklist
1. Drag-and-drop a PNG/JPG → preview renders → “Extract Text with AI” runs Tesseract.
2. Click the drop zone → select a PDF → see document card → extraction runs via pdf.js.
3. Upload a DOCX → mammoth extracts raw text.
4. Try an unsupported type / oversized file → receive validation error.
5. Cancel during processing → state returns to preview.

## 6. Hand-off to Module 2
At the end of Module 1 we have **raw text plus basic metadata** for any uploaded CV, and the data is stored centrally in Zustand. Module 2 (documented separately) builds on this by interpreting the OCR output, detecting layout, and ultimately recreating the CV as editable HTML/CSS.

Use this guide to reproduce the Module 1 work if you need to onboard a new machine or teammate before jumping into Module 2.
