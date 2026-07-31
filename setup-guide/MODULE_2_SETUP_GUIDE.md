# Module 2 Setup Guide · Layout Reconstruction & Gemini Integration

Module 2 takes the raw OCR/text extraction work from Module 1 and turns it into a pixel-perfect, editable CV. This document explains every code change, file, and technology introduced during this module.

---

## 1. Goals

1. Capture **layout metadata** (bounding boxes, columns, margins, font sizes) from OCR output.
2. Build a **deterministic renderer** that recreates the CV using absolute positioning.
3. Add a **Gemini (Google Generative AI) pipeline** that receives layout data + text and returns HTML/CSS replicas. Fall back to deterministic rendering if Gemini is unavailable.
4. Persist everything (HTML, CSS, layout, blocks) in the Zustand store so the editor/export features can reuse it.

---

## 2. Prerequisites

- Module 1 completed.
- Node.js 18+.
- A Google AI Studio API key stored as `GEMINI_API_KEY` in `.env`.
- `npm install` has been run (installs `@google/generative-ai`).

```bash
cp .env.example .env
# edit .env and set GEMINI_API_KEY + optional GEMINI_MODEL
```

Restart `npm run dev` whenever `.env` changes.

---

## 3. File & Code Changes

### 3.1 `src/lib/services/layoutAnalyzer.ts`

**Technologies:** TypeScript, OCR metadata processing.

**What changed:**
- Added a `LayoutBlock` interface and extended `LayoutAnalysis` to include a `blocks` array.
- `analyzeLayout()` now groups words into lines, detects columns/sections, estimates margins, and emits `LayoutBlock`s with `text`, `bbox`, `fontSize`, `fontWeight`, and `sectionType`.
- Fallback logic ensures we always have blocks, even if OCR returns limited geometry.

### 3.2 `src/lib/services/layoutRenderer.ts`

**Purpose:** Deterministic HTML/CSS builder.

**Details:**
- Takes `{ layout, blocks, colorPalette }` and outputs `{ html, css }`.
- Clamps padding derived from layout margins and absolutely positions every block with the measured coordinates.
- Used whenever Gemini fails or the user disables AI generation.

### 3.3 `src/lib/services/cvProcessor.ts`

**Responsibilities:** Orchestrates OCR → layout → Gemini/fallback.

**Changes:**
- After OCR and color extraction, it calls `analyzeLayout()` to get `LayoutBlock`s.
- Builds a payload (text, palette, layout, blocks) and POSTs to `/api/generate-cv`.
- If the response succeeds, uses Gemini’s HTML/CSS; otherwise calls `renderDeterministicCV`.
- Returns and stores `html`, `css`, `layout`, and `blocks` in the Zustand store for downstream use.

### 3.4 `src/app/api/generate-cv/route.ts`

**Technologies:** Next.js App Router API route, `@google/generative-ai`.

**Highlights:**
- Accepts the payload from `cvProcessor` (text, palette, layout metadata, block coordinates).
- Builds a detailed prompt describing page size, columns, margins, font sizes, sections, and up to ~150 layout blocks.
- Calls Gemini (default `gemini-1.5-pro`) with `GEMINI_API_KEY`.
- Parses Gemini output (`{ html, css }` JSON). If parsing fails, returns a static fallback template.
- `GET /api/generate-cv` simply reports whether `GEMINI_API_KEY` is configured.

### 3.5 `src/hooks/useAppStore.ts`

**Update:**
- `GeneratedCV` now stores `layout: LayoutAnalysis` and `blocks: LayoutBlock[]`.
- Editor/regeneration flows read these values so they can re-run Gemini or deterministic rendering without re-uploading the file.

### 3.6 Supporting files
- `.env.example` documents the required `GEMINI_API_KEY` and optional `GEMINI_MODEL`.
- `.gitignore` now explicitly ignores `.env`.
- `README.md` explains the Gemini requirement and setup.

---

## 4. Technologies & Libraries Used

| Area | Library | Why |
|------|---------|-----|
| OCR | `tesseract.js` (from Module 1) | Extracts words + bounding boxes from images. |
| Document parsing | `pdfjs-dist`, `mammoth` (Module 1) | Provide text for PDFs/DOCX files, feeding layout analyzer. |
| Layout inference | Custom logic in `layoutAnalyzer.ts` | Detects columns/sections and emits `LayoutBlock` geometry. |
| AI generation | `@google/generative-ai` | Calls Gemini to rebuild HTML/CSS using the captured geometry. |
| State | Zustand | Stores generated CV data for the editor and exports. |

---

## 5. File Structure Snapshot

```
src/
├── app/
│   ├── api/generate-cv/route.ts   # Gemini API route
│   ├── editor/page.tsx           # uses stored layout/blocks
│   └── upload/page.tsx           # triggers OCR → layout pipeline
├── hooks/useAppStore.ts          # stores GeneratedCV + layout metadata
└── lib/services/
    ├── cvProcessor.ts            # orchestrates everything
    ├── layoutAnalyzer.ts         # emits layout + block data
    └── layoutRenderer.ts         # deterministic fallback renderer
```

---

## 6. Running Module 2

```bash
npm install                # ensures @google/generative-ai is present
npm run dev                # start Next.js (http://localhost:3000)
```

1. Navigate to `/upload` and drop a CV screenshot/PDF/DOCX.
2. Observe the stages: OCR → colors → layout analysis → Gemini.
3. If Gemini succeeds, the preview updates with the AI replica; if it fails, the deterministic layout renders immediately.
4. Click “Continue to Editor” to edit/export the generated HTML/CSS.

---

## 7. Troubleshooting

| Symptom | Resolution |
|---------|------------|
| `GEMINI_API_KEY not configured` | Add key to `.env`, restart `npm run dev`. |
| Gemini timeout / invalid JSON | We automatically fall back to the deterministic renderer; check server logs for the Gemini response for debugging. |
| Layout misalignment | Ensure the uploaded CV is high-resolution and cropped tightly; poor OCR geometry directly affects the layout analyzer. |

---

## 8. Next Steps

Module 3 will leverage the stored `layout`/`blocks` to power inline editing, section reordering, and richer export formats. Keep this guide handy when onboarding teammates or reproducing Module 2 on a new machine.
