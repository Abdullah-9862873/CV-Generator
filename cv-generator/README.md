# CV Generator

Turn any static CV (image/PDF/DOCX) into editable HTML + CSS with pixel-level accuracy. The app runs OCR + layout analysis in the browser, then asks **Google Gemini** to recreate the document using the captured coordinates. If the AI call fails, a deterministic renderer guarantees that you still receive a faithful replica.

## Features
- Drag & drop upload with preview, validation, and progress states.
- OCR/Text extraction for images (Tesseract), PDFs (pdf.js), and DOCX (mammoth).
- Layout analyzer that records bounding boxes, columns, font sizes, and colors for every block of text.
- Gemini-powered HTML/CSS generation with deterministic fallback.
- Split editor (code + live preview) plus export options (HTML/CSS zip, PDF print, DOCX).

## Requirements
- Node.js 18+
- npm 9+
- A Google AI Studio key (to enable Gemini). Without a key the deterministic renderer still works, but the README assumes you want AI output.

## Setup
1. **Clone & install**
   ```bash
   git clone <repo-url>
   cd cv-generator
   npm install
   ```
2. **Environment variables** – copy the template and add your key:
   ```bash
   cp .env.example .env
   ```
   Update `.env`:
   ```env
   GEMINI_API_KEY=sk-your-key-here
   GEMINI_MODEL=gemini-1.5-pro   # optional override
   ```
   Restart any running dev server after editing `.env`.

## Running the app
```bash
npm run dev            # start Next.js (http://localhost:3000)
npm run build          # production build + lint/type checks
```

## Typical workflow
1. `npm run dev`
2. Visit `http://localhost:3000/upload`
3. Drop a CV screenshot/PDF/DOCX
4. Wait for OCR → layout → Gemini pipeline to finish (progress messages appear)
5. Click “Continue to Editor” to inspect/edit the generated HTML/CSS
6. Export using the dropdown (zip/pdf/docx) if needed

## Troubleshooting
| Symptom | Fix |
| --- | --- |
| `GEMINI_API_KEY not configured` | Add the key to `.env`, restart dev server. |
| Gemini call times out or returns invalid JSON | The deterministic renderer automatically takes over; check server logs for the Gemini response for debugging. |
| Preview misaligned | Ensure uploaded CV is cropped tightly and text is legible; noisy scans lead to weak OCR geometry. |

Happy hacking! Open issues/PRs are welcome.
