# CV Generator - Vision-Based Exact Replication Upgrade

## Overview
The CV generator has been upgraded to use **Gemini's vision capabilities** to create exact replicas of uploaded CVs, matching fonts, styles, spacing, and visual appearance pixel-for-pixel.

## Key Changes

### 1. Image Data Processing (`cvProcessor.ts`)
- **Added `fileToBase64` helper function**: Converts uploaded CV images to base64 format
- **Enhanced payload**: Now includes the original CV image alongside extracted text and layout data
- **Vision-first approach**: The AI can now "see" the CV to analyze visual styling

```typescript
// Image is converted to base64 and sent to the API
const imageBase64 = await fileToBase64(imageFile);
const payload = {
  extractedText,
  image: { base64: imageBase64, mimeType: imageFile.type },
  colorPalette,
  layoutData,
  blocks
};
```

### 2. Enhanced API Route (`route.ts`)

#### Updated Interface
```typescript
export interface CVGenerationRequest {
  extractedText: string;
  image?: {              // NEW: Image data for vision analysis
    base64: string;
    mimeType: string;
  };
  colorPalette?: {...};
  layoutData?: {...};
  blocks?: [...];
  model?: string;
}
```

#### Vision-Enabled Gemini Call
The `callGemini` function now accepts image data and uses Gemini's multimodal capabilities:

```typescript
async function callGemini(
  prompt: string, 
  modelName: string, 
  imageData?: { base64: string; mimeType: string }
): Promise<string> {
  // If image is provided, use vision capabilities
  if (imageData) {
    const imagePart = {
      inlineData: {
        data: imageData.base64,
        mimeType: imageData.mimeType,
      },
    };
    
    const result = await model.generateContent([
      SYSTEM_PROMPT,
      "Here is the CV image to analyze and replicate:",
      imagePart,
      "\n\n" + prompt
    ]);
    return result.response.text();
  }
  // ... text-only fallback
}
```

### 3. Enhanced System Prompt
The AI now receives detailed instructions to:

1. **Visual Analysis**: Identify exact font families, weights, sizes, letter spacing, and line height
2. **Layout Precision**: Match column layouts, spacing, margins, borders, and positioning
3. **Color Accuracy**: Use extracted colors precisely for text, backgrounds, and accents
4. **Typography Details**: Replicate heading styles, paragraph formatting, and list styles
5. **Visual Elements**: Include section dividers, borders, backgrounds, and decorations
6. **Structure**: Use semantic HTML5 with proper hierarchy
7. **Responsive & Print-Ready**: Optimize for screens and printing

### 4. Improved User Prompt
When an image is provided, the prompt now includes:

```
IMAGE PROVIDED: Analyze the CV image carefully to identify:
- EXACT font families (look for Arial, Helvetica, Calibri, Times New Roman, Georgia, etc.)
- Font weights and styles (light, regular, medium, semibold, bold, italic)
- Precise font sizes for each text element
- Letter spacing, line height, and text alignment
- Visual hierarchy and spacing between sections
- Border styles, thickness, and colors
- Background colors and patterns
- Any visual decorations or design elements

CRITICAL: Study the image to determine the EXACT fonts used. Common CV fonts include:
- Sans-serif: Arial, Helvetica, Calibri, Verdana, Tahoma, "Segoe UI"
- Serif: Times New Roman, Georgia, Garamond, "Palatino Linotype"
Match the font family, weight, and size as closely as possible to the image.
```

## How It Works

### Processing Flow
1. **User uploads CV** → Image file is received
2. **OCR extraction** → Text content is extracted using Tesseract
3. **Color analysis** → Color palette is extracted from the image
4. **Layout analysis** → Structure, margins, sections, and blocks are identified
5. **Image conversion** → CV image is converted to base64
6. **Vision-based AI generation** → Gemini analyzes the image AND text data to create exact HTML/CSS replica
7. **Fallback rendering** → If AI fails, deterministic renderer creates a basic version

### What Gemini Can Now Detect
- **Font families**: Arial, Calibri, Times New Roman, Georgia, etc.
- **Font properties**: Size, weight (bold, regular), style (italic)
- **Spacing**: Line height, letter spacing, margins, padding
- **Visual styling**: Borders, backgrounds, colors, decorations
- **Layout structure**: Single/multi-column, sidebar layouts, section organization
- **Typography hierarchy**: Heading levels, emphasis, lists

## Benefits

✅ **Exact Font Matching**: AI identifies the actual fonts used in the CV  
✅ **Precise Spacing**: Replicates margins, padding, and line heights accurately  
✅ **Visual Fidelity**: Matches colors, borders, and design elements  
✅ **Layout Preservation**: Maintains the original structure and organization  
✅ **Style Consistency**: Replicates bold, italic, underline, and other text styles  

## Testing

To test the vision-based replication:

1. Upload a CV with distinctive fonts (e.g., Georgia, Calibri, custom fonts)
2. Check the generated HTML/CSS for:
   - Correct font-family declarations
   - Accurate font sizes and weights
   - Proper spacing and margins
   - Color accuracy
   - Layout structure matching the original

## Future Enhancements

- **Font detection confidence**: Report which fonts were detected with confidence scores
- **Style comparison**: Show side-by-side comparison of original vs. generated
- **Manual font override**: Allow users to specify fonts if detection is incorrect
- **Advanced typography**: Support for custom fonts, web fonts, and font fallbacks
