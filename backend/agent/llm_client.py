import ollama
from backend.config import config

def generate(prompt: str, model: str = None, system: str = None, history: list = None) -> str:
    if model is None:
        model = config.agent_model
    """
    Sends a prompt to the local Ollama instance and returns the generated text response.
    """
    messages = []
    
    # If a system prompt is provided, append it first
    if system:
        messages.append({
            "role": "system",
            "content": system
        })
        
    # Append conversation history
    if history:
        for msg in history:
            # We assume history comes from the frontend format: { "sender": "user" | "agent", "text": "..." }
            role = "user" if msg.get("sender") == "user" else "assistant"
            messages.append({
                "role": role,
                "content": msg.get("text", "")
            })
        
    # Append the user's prompt
    messages.append({
        "role": "user",
        "content": prompt
    })
    
    try:
        # Call the chat endpoint (synchronous)
        response = ollama.chat(
            model=model,
            messages=messages
        )
        return response["message"]["content"]
    except Exception as e:
        return f"Error communicating with Ollama: {str(e)}\n\nMake sure Ollama is running and the model '{model}' is pulled."
