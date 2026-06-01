import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
print(f"API key loaded: {'YES' if api_key else 'NO'}")
if api_key:
    print(f"Key preview: {api_key[:8]}...{api_key[-4:]}")

genai.configure(api_key=api_key)

print("\nAvailable models that support generateContent:")
available = []
for m in genai.list_models():
    if "generateContent" in m.supported_generation_methods:
        print(f"  {m.name}")
        available.append(m.name)

if not available:
    print("No models available — check your API key.")
else:
    # Pick the first flash model available, fall back to the first listed
    preferred = next(
        (m for m in available if "flash" in m and "2.0" in m),
        next((m for m in available if "flash" in m), available[0])
    )
    # Strip the "models/" prefix that list_models returns
    model_id = preferred.replace("models/", "")
    print(f"\nUsing model: {model_id}")

    model = genai.GenerativeModel(model_id)
    print("Sending hello message to Gemini...")
    response = model.generate_content("Say hello and introduce yourself in one sentence.")
    print(f"\nGemini response:\n{response.text}")
