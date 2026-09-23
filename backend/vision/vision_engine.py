import ollama
import base64
from pathlib import Path

def analyze_image(image_path: str, question: str, model: str = "llava:7b") -> str:
    """
    Takes a path to an image on disk and a question about that image.
    Sends the image and question to the local Ollama vision model.
    """
    
    # Ensure the file exists
    if not Path(image_path).exists():
        return f"Error: Image not found at {image_path}"
        
    try:
        # Read and encode the image in base64
        with open(image_path, "rb") as img_file:
            img_b64 = base64.b64encode(img_file.read()).decode("utf-8")
            
        # Send to Ollama
        response = ollama.chat(
            model=model,
            messages=[{
                "role": "user",
                "content": question,
                "images": [img_b64],
            }]
        )
        
        return response["message"]["content"]
        
    except Exception as e:
        return f"Error communicating with vision model: {str(e)}\nMake sure '{model}' is pulled in Ollama."
