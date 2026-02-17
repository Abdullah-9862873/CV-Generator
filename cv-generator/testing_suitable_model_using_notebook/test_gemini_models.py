"""
🔍 Gemini API Model Testing Script

This script will:
1. Test your Gemini API key
2. List all available models
3. Test which models support vision (images)
4. Find the best model for CV replication
"""

import google.generativeai as genai
from PIL import Image, ImageDraw

# Your API key from .env file
API_KEY = "AIzaSyCOk87jVL0DjJvbabAiG0kUmvn4tX1L2bk"

# Configure the API
genai.configure(api_key=API_KEY)
print("✅ API configured successfully!\n")

# Step 1: List all available models
print("=" * 80)
print("📋 STEP 1: Listing all available Gemini models")
print("=" * 80)

models = []
for model in genai.list_models():
    models.append(model)
    print(f"\n🤖 Model: {model.name}")
    print(f"   Display Name: {model.display_name}")
    print(f"   Supported Methods: {model.supported_generation_methods}")

print(f"\n✅ Found {len(models)} models total\n")

# Step 2: Filter models that support content generation
print("=" * 80)
print("📋 STEP 2: Models that support 'generateContent'")
print("=" * 80)

generation_models = []
for model in models:
    if 'generateContent' in model.supported_generation_methods:
        generation_models.append(model)
        print(f"✅ {model.name}")

print(f"\n📊 {len(generation_models)} models support generateContent\n")

# Step 3: Test text-only generation
print("=" * 80)
print("📋 STEP 3: Testing text-only generation")
print("=" * 80)

test_prompt = "Say 'Hello, I am working!' in exactly 5 words."
working_text_models = []

for model_info in generation_models:
    model_name = model_info.name
    print(f"Testing {model_name}...", end=" ")
    
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(test_prompt)
        print(f"✅ SUCCESS")
        working_text_models.append(model_name)
    except Exception as e:
        print(f"❌ FAILED: {str(e)[:80]}")

print(f"\n✅ {len(working_text_models)} models work for text generation\n")

# Step 4: Create a test image
print("=" * 80)
print("📋 STEP 4: Creating test CV image")
print("=" * 80)

img = Image.new('RGB', (400, 200), color='white')
draw = ImageDraw.Draw(img)

# Draw some text
draw.text((20, 20), "John Doe", fill='black')
draw.text((20, 60), "Software Engineer", fill='gray')
draw.text((20, 100), "john.doe@email.com", fill='blue')
draw.text((20, 140), "(555) 123-4567", fill='blue')

img.save('test_cv_image.png')
print("✅ Test image created: test_cv_image.png\n")

# Step 5: Test vision capabilities
print("=" * 80)
print("📋 STEP 5: Testing vision capabilities (image + text)")
print("=" * 80)

test_image = Image.open('test_cv_image.png')
vision_prompt = "What text do you see in this image? List each line."

working_vision_models = []

for model_name in working_text_models:
    print(f"Testing {model_name} with image...", end=" ")
    
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content([vision_prompt, test_image])
        print(f"✅ VISION WORKS!")
        print(f"   Response: {response.text[:100]}")
        working_vision_models.append(model_name)
    except Exception as e:
        error_msg = str(e)
        if "does not support" in error_msg or "image" in error_msg.lower():
            print(f"❌ No vision support")
        else:
            print(f"❌ Error: {error_msg[:60]}")

print(f"\n🎯 {len(working_vision_models)} models support VISION!\n")

# Step 6: Test CV replication
if working_vision_models:
    print("=" * 80)
    print("📋 STEP 6: Testing CV replication")
    print("=" * 80)
    
    best_model = working_vision_models[0]
    print(f"🎯 Using: {best_model}\n")
    
    cv_prompt = """Analyze this CV image and tell me what text you see.
    List the name, job title, email, and phone number."""
    
    try:
        model = genai.GenerativeModel(best_model)
        response = model.generate_content([cv_prompt, test_image])
        
        print("✅ CV Analysis Response:")
        print("-" * 80)
        print(response.text)
        print("-" * 80)
        
        # Check if it used actual content
        if "John Doe" in response.text:
            print("\n✅ SUCCESS! Model can read text from images!")
        else:
            print("\n⚠️ Model response doesn't include expected text")
            
    except Exception as e:
        print(f"❌ Error: {e}")

# Step 7: Summary
print("\n" + "=" * 80)
print("📊 SUMMARY & RECOMMENDATION")
print("=" * 80)

print(f"\n✅ Total models available: {len(models)}")
print(f"✅ Models with generateContent: {len(generation_models)}")
print(f"✅ Models that work (text): {len(working_text_models)}")
print(f"✅ Models with VISION support: {len(working_vision_models)}")

if working_vision_models:
    print("\n🎯 RECOMMENDED MODELS FOR YOUR CV GENERATOR:")
    for i, model in enumerate(working_vision_models, 1):
        model_name = model.replace('models/', '')
        print(f"   {i}. {model_name}")
    
    print("\n📝 Update your .env file with:")
    recommended_model = working_vision_models[0].replace('models/', '')
    print(f"   GEMINI_MODEL={recommended_model}")
    
    print("\n✅ This model should work for your CV generator!")
else:
    print("\n❌ No vision-capable models found with your API key.")
    print("\n💡 Possible solutions:")
    print("   1. Enable Gemini API in Google Cloud Console")
    print("   2. Generate a new API key at https://aistudio.google.com/")
    print("   3. Use OpenAI GPT-4 Vision instead")
    print("   4. Use a local solution (Ollama with llava model)")

print("\n" + "=" * 80)
print("✅ Testing complete!")
print("=" * 80)
