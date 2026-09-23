import ollama

def generate(prompt: str, model: str = "qwen2.5:7b-instruct", system: str = None) -> str:
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
