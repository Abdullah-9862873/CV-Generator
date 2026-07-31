# Testing the Vision-Based CV Replication

## Quick Test Guide

### 1. Start the Application
The dev server should already be running. If not:
```bash
npm run dev
```

### 2. Test the Vision Feature

#### Upload a CV
1. Open your browser to `http://localhost:3000`
2. Upload a CV image (PDF will be converted to image)
3. Wait for processing

#### What to Look For

**In the Console (Browser DevTools):**
- Look for: `"Calling Gemini model gemini-1.5-pro with image"`
- This confirms the image is being sent to Gemini

**In the Generated CV:**
- **Font accuracy**: Compare the font family in the generated CSS with the original
- **Font sizes**: Check if heading, body, and small text sizes match
- **Spacing**: Verify margins, padding, and line heights are similar
- **Colors**: Ensure text, background, and accent colors match
- **Layout**: Check if columns, sections, and overall structure are preserved

### 3. Inspect the Generated Code

After generation, you can:
1. Right-click on the preview → "Inspect Element"
2. Look at the `<style>` tag or external CSS
3. Check for:
   ```css
   body {
     font-family: 'Calibri', 'Arial', sans-serif; /* Should match original */
     font-size: 11pt;
     line-height: 1.6;
   }
   
   h1 {
     font-family: 'Georgia', serif; /* Should match original heading font */
     font-size: 28pt;
     font-weight: 700;
   }
   ```

### 4. Compare Original vs Generated

**Original CV Indicators:**
- What font does the original use? (Look at the uploaded image)
- What's the heading size vs body text size ratio?
- Are there borders or dividers?
- What's the color scheme?

**Generated CV Should Match:**
- Same or similar font family
- Same size ratios
- Same visual elements (borders, dividers)
- Same colors (using the extracted palette)

### 5. Test Different CV Styles

Try uploading CVs with:
- **Different fonts**: Arial, Calibri, Times New Roman, Georgia
- **Different layouts**: Single column, two-column, sidebar
- **Different styles**: Minimal, colorful, professional, creative
- **Different elements**: Borders, backgrounds, icons, dividers

### 6. Debugging

If the vision feature isn't working:

**Check the API logs:**
```bash
# In the terminal where npm run dev is running
# Look for errors related to Gemini API
```

**Check the browser console:**
```javascript
// Should see:
"OCR Result - fullText length: XXX"
"Extracted colors: {...}"
"Layout analysis: {...}"
"Calling Gemini model gemini-1.5-pro with image"
```

**Verify environment variables:**
```bash
# Check .env file
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-pro
```

### 7. Expected Improvements

**Before (Text-only):**
- Generic fonts (Arial, sans-serif)
- Approximate sizing
- Basic layout
- Limited style matching

**After (Vision-enabled):**
- Exact font detection (Calibri, Georgia, etc.)
- Precise sizing from visual analysis
- Accurate layout replication
- Style details (borders, spacing, decorations)

## Example Test Cases

### Test Case 1: Modern Sans-Serif CV
- **Original**: Uses Calibri, clean layout, blue accents
- **Expected**: Generated CV uses Calibri (or close fallback), maintains clean spacing, matches blue tones

### Test Case 2: Classic Serif CV
- **Original**: Uses Times New Roman, traditional layout, black/white
- **Expected**: Generated CV uses Times New Roman, preserves formal structure, maintains contrast

### Test Case 3: Two-Column CV
- **Original**: Sidebar with skills, main content area
- **Expected**: Generated CV maintains two-column layout with proper width ratios

### Test Case 4: Colorful Creative CV
- **Original**: Multiple colors, custom fonts, decorative elements
- **Expected**: Generated CV captures color palette, attempts font matching, includes visual elements

## Success Criteria

✅ Font family matches or is a close approximation  
✅ Font sizes are proportionally correct  
✅ Layout structure is preserved  
✅ Colors match the extracted palette  
✅ Spacing and margins are similar  
✅ Visual elements (borders, dividers) are included  
✅ Overall appearance is recognizably similar to the original  

## Troubleshooting

**Issue**: "Calling Gemini model gemini-1.5-pro text-only"
- **Cause**: Image data not being sent
- **Fix**: Check that `fileToBase64` is working and payload includes `image` field

**Issue**: Generated CV doesn't match fonts
- **Cause**: Gemini might not be detecting fonts accurately
- **Fix**: Ensure the uploaded image is high quality and text is clear

**Issue**: API errors
- **Cause**: Gemini API key or quota issues
- **Fix**: Verify `GEMINI_API_KEY` in `.env` and check API quota

**Issue**: Fallback HTML is generated
- **Cause**: Gemini call failed
- **Fix**: Check console for error messages, verify API connectivity
