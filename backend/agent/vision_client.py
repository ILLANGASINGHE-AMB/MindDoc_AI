import ollama
from pathlib import Path
from backend.config import config

def describe_image(image_path: str) -> str:
    """
    Sends an image to the local Ollama instance running a vision model
    and returns a highly detailed textual description of its contents.
    """
    try:
        # Use llava:7b vision model (installed locally)
        model = "llava:7b"
        
        prompt = (
            "You are a highly capable AI Vision assistant. "
            "Please analyze this image in extreme detail. "
            "Describe the overall scene, all objects present, spatial relationships, "
            "charts, graphs, or data structures visible. "
            "If it is a receipt or document, describe its structural layout. "
            "Do NOT transcribe large blocks of text (OCR will handle that separately), "
            "but do describe the visual context and visual meaning of the image."
        )
        
        response = ollama.chat(
            model=model,
            messages=[{
                "role": "user",
                "content": prompt,
                "images": [image_path]
            }]
        )
        return response["message"]["content"]
    except Exception as e:
        return f"[Vision Analysis Failed or Unavailable: {str(e)}]"
