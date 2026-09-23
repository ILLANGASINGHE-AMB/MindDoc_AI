def build_context(chunks: list[dict], max_chars: int = 6000) -> str:
    """
    Takes a list of document chunks and formats them into a single string to be passed
    to the LLM as context. It truncates at max_chars to prevent overflowing the LLM context window.
    """
    context_lines = []
    current_length = 0
    
    for c in chunks:
        # Format explicitly states the document and the page number
        entry = f"--- [Document: {c['doc_id']} | Page: {c['page']}] ---\n{c['text']}\n"
        
        if current_length + len(entry) > max_chars:
            break
            
        context_lines.append(entry)
        current_length += len(entry)
        
    return "\n".join(context_lines)
