# 🔍 Gemini Model Testing

This will test your Gemini API key and find which models support vision capabilities.

## Quick Start

### Option 1: Python Script (Recommended)

```bash
# Install required package
pip install google-generativeai pillow

# Run the test script
python test_gemini_models.py
```

### Option 2: Jupyter Notebook

```bash
# Install Jupyter if you don't have it
pip install jupyter google-generativeai pillow

# Start Jupyter
jupyter notebook

# Open test_gemini_models.ipynb and run all cells
```

## What It Does

The script will:

1. ✅ **Test your API key** - Verify it's valid
2. 📋 **List all models** - Show every Gemini model available
3. 🧪 **Test text generation** - See which models work for text
4. 🖼️ **Test vision** - Find models that can analyze images
5. 🎯 **Test CV replication** - Check if the model can read text from images
6. 📝 **Give recommendation** - Tell you which model to use

## Expected Output

```
✅ API configured successfully!

📋 STEP 1: Listing all available Gemini models
================================================
🤖 Model: models/gemini-1.5-flash
   Display Name: Gemini 1.5 Flash
   Supported Methods: ['generateContent', 'countTokens']

🤖 Model: models/gemini-1.5-pro
   Display Name: Gemini 1.5 Pro
   Supported Methods: ['generateContent', 'countTokens']

...

📋 STEP 5: Testing vision capabilities
================================================
Testing models/gemini-1.5-flash with image... ✅ VISION WORKS!
Testing models/gemini-pro-vision with image... ✅ VISION WORKS!

🎯 2 models support VISION!

📊 SUMMARY & RECOMMENDATION
================================================
✅ Total models available: 15
✅ Models with generateContent: 10
✅ Models that work (text): 8
✅ Models with VISION support: 2

🎯 RECOMMENDED MODELS FOR YOUR CV GENERATOR:
   1. gemini-1.5-flash
   2. gemini-pro-vision

📝 Update your .env file with:
   GEMINI_MODEL=gemini-1.5-flash

✅ This model should work for your CV generator!
```

## After Running

1. **Check the output** - Look for models marked with "✅ VISION WORKS!"
2. **Copy the recommended model name**
3. **Update your `.env` file**:
   ```
   GEMINI_MODEL=<recommended-model-name>
   ```
4. **Restart your dev server**:
   ```bash
   npm run dev
   ```

## Troubleshooting

### "No vision-capable models found"

This means your API key doesn't have access to vision models. Solutions:

1. **Generate a new API key** at https://aistudio.google.com/app/apikey
2. **Enable Gemini API** in Google Cloud Console
3. **Try a different Google account**
4. **Use OpenAI GPT-4 Vision** instead (requires OpenAI API key)

### "API key not valid"

Your API key might be:
- Expired
- Revoked
- From a different project

Generate a new one at https://aistudio.google.com/app/apikey

### "ImportError: No module named 'google.generativeai'"

Install the package:
```bash
pip install google-generativeai pillow
```

## What Happens Next

Once you find a working vision model:

1. The script will tell you which model to use
2. Update your `.env` file with that model name
3. Restart your CV generator
4. Upload a CV and it should work!

## Files Created

- `test_cv_image.png` - A simple test CV image
- Console output showing all available models

## Need Help?

If no vision models work, we can:
1. Switch to OpenAI GPT-4 Vision (more reliable)
2. Use Ollama locally (free, no API needed)
3. Enhance the deterministic renderer (no AI needed)

Run the script and share the output! 🚀
