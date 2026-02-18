# 🚀 From Problem to Product: The CV Generator Journey

---

## The Problem That Started It All

I noticed something fascinating in the market: **people were paying CV makers just to end up arguing with them for minor changes.**

Whether it's a subtle color shift, a font change, or repositioning a section — these "quick fixes" often turned into frustrating back-and-forths. And let's be honest — professional CV templates? They're expensive.

What if there was a better way?

What if users could simply **upload an image, screenshot, PDF, or Word document** of a CV they liked — even if it wasn't "available" anywhere — and our application would **convert it into editable HTML+CSS code** automatically?

No middlemen. No expensive templates. No arguments.

---

## The Vision: No-Code CV Editing for Everyone

I wanted to build something that bridges two worlds:

- **Non-tech users** who just want a simple platform to edit their CVs without touching a single line of code
- **Tech-savvy users** who want the raw HTML+CSS to customize everything themselves

And unlike Overleaf or LaTeX editors (which are powerful but have a steep learning curve), this targets the majority of people who just want their CV — fast, affordable, and customizable.

The market is flooded with paid CV editors. I wanted to build something **cheap or free** that actually works.

---

## The Tech Stack

Building an MVP meant choosing the right tools:

- **Frontend**: Next.js + React + TypeScript
- **State Management**: Zustand
- **OCR**: Tesseract.js (for images)
- **PDF Processing**: pypdf
- **Word Processing**: mammoth.js
- **AI Engine**: Google Gemini 2.5 Flash (with vision capabilities)

---

## Chapter 1: The Vision Problem

When we started building the CV Generator, we faced a critical challenge: **How do we take a photo of a CV and recreate it as an editable HTML document?**

The requirements were daunting:

- Extract text from images (OCR)
- Understand layout structure (columns, sections, positioning)
- Replicate fonts, colors, spacing exactly
- Generate clean, editable HTML/CSS

Our first thought: We need AI with vision capabilities.

---

## Chapter 2: Exploring Ollama (The Local Hero)

**What we considered:**

- Ollama with the LLaVA model (Large Language and Vision Assistant)
- Running locally on our own hardware
- Completely free, no API costs
- Full privacy — data never leaves our machine

**Why we considered it:**

- Zero ongoing costs
- No rate limits
- Works offline
- Great for privacy-conscious users

**Why we ultimately didn't use it:**

- Required powerful local GPU (expensive hardware)
- Setup complexity for users
- Slower inference times
- Limited to local deployment only
- Wouldn't work well for a web-based SaaS product

**The Reality:** Ollama stayed in our notes as the "ideal backup plan" but wasn't practical for a production web app.

---

## Chapter 3: The Hugging Face Exploration

**What we looked at:**

- Hugging Face Transformers with vision-language models
- Models like Salesforce/blip-image-captioning-base
- Microsoft/DiT (Document Image Transformer)
- Various OCR-specific models

**What we discovered:**

1. **Model Fragmentation**: No single model did everything we needed
   - One model for OCR
   - Another for layout analysis
   - Another for HTML generation
   - Complex pipeline to stitch them together

2. **Performance Issues**:
   - Most vision models required significant compute
   - Inference times were too slow for real-time use
   - Self-hosting would be expensive

3. **Integration Complexity**:
   - Different models had different input/output formats
   - Hard to standardize the pipeline

**Why we rejected Hugging Face:** Too complex to integrate multiple models. No "one model to rule them all."

---

## Chapter 4: The OpenAI Temptation

**What we considered:**

- GPT-4 Vision (GPT-4V)
- GPT-4 Turbo with vision
- The gold standard for multimodal AI

**Why we were tempted:**

- Best-in-class vision capabilities
- Excellent at understanding document structure
- Proven track record

**Why we didn't choose it initially:**

- Cost concerns: More expensive per token than alternatives
- Rate limiting: Stricter quotas for new projects
- Had already started prototyping with Gemini
- Google AI SDK was more straightforward

**Plot Twist:** We actually documented OpenAI GPT-4 Vision as our **fallback option** in case Gemini failed. It's still in our emergency playbook!

---

## Chapter 5: Finding Gemini — The Vision-First Champion

We created a comprehensive testing suite to evaluate every available Gemini model.

### Models We Tested:

| Model | Result | Why |
|-------|--------|-----|
| gemini-2.5-flash | ✅ WINNER | Fast, affordable, great accuracy |
| gemini-2.5-pro | ⚠️ Quota exceeded | Better quality but rate limited |
| gemini-2.0-flash | ⚠️ Quota exceeded | Good but hit limits |
| gemini-1.5-pro | ✅ Working | Reliable but slower |
| gemini-1.5-flash | ✅ Recommended | Good alternative |

**Full list tested: 30+ models including experimental ones!**

### Why Gemini Won

1. **Multimodal by Design** — We can send BOTH image and text in one call

```javascript
const result = await model.generateContent([
  SYSTEM_PROMPT,
  imagePart,        // The CV image
  textPrompt        // Layout data + extracted text
]);
```

2. **Vision That Understands Documents** — Gemini doesn't just "see" the image — it understands:
   - Font families (Arial vs Calibri vs Times)
   - Color schemes (exact hex codes)
   - Layout structures (sidebar layouts, multi-column)
   - Visual hierarchy (headers, sections, spacing)

3. **Cost-Effective** — Gemini 2.5 Flash: Optimized for speed and cost. Free tier available for testing. Competitive pricing vs. OpenAI.

4. **Google Ecosystem Integration** — Already using Google for OCR? Check. Clean SDK? Check.

5. **The Self-Critique Feature** — We implemented a unique approach where Gemini judges its own work and provides an accuracy score.

---

## Chapter 6: The Architecture Decision

### Our Final Stack

```
┌─────────────────────────────────────────────┐
│           CV Generator Stack                │
├─────────────────────────────────────────────┤
│ Frontend: Next.js + React + TypeScript     │
├─────────────────────────────────────────────┤
│ OCR: Tesseract.js (browser-based)          │
├─────────────────────────────────────────────┤
│ AI: Google Gemini 2.5 Flash                │
│     - Vision capabilities                  │
│     - Multimodal input                     │
│     - Self-critique scoring                │
├─────────────────────────────────────────────┤
│ Fallback: Deterministic Renderer           │
│     - No AI required                       │
│     - Uses OCR bounding boxes              │
│     - Always works                          │
└─────────────────────────────────────────────┘
```

---

## Why HTML+CSS Over LaTeX?

A deliberate choice.

While LaTeX (used by Overleaf) is powerful, it gives **less flexibility** for design customization. HTML+CSS gives **more authority** over the final look and feel — and it's universally understood.

Plus, editing HTML is far more intuitive for the average user than debugging LaTeX syntax errors.

---

## Hackathon MVP → Production Ready

This application was **designed for a hackathon**, but the actual implementation targets both tech and non-tech users:

- **Non-tech users**: Edit the CV directly in the UI, and the HTML+CSS updates in real-time
- **Tech users**: Grab the raw HTML+CSS code and customize it to their heart's content

---

## What's Next?

This is just the beginning. The vision is to make professional CV creation **accessible, affordable, and frustration-free** for everyone.

If you've ever struggled with CV templates or paid someone to make "minor changes" — this is for you.

---

**#CVGenerator #AI #WebDevelopment #Hackathon #NextJS #TypeScript #GeminiAI #NoCode #ProductDevelopment #StartupJourney**

---

*Feel free to reach out if you want to collaborate or learn more about the technical implementation!*
