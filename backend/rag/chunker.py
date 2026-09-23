def chunk_text(text: str, page_number: int, doc_id: str,
               chunk_size: int = 800, overlap: int = 150) -> list[dict]:
    """
    Splits text into overlapping chunks to preserve semantic context across chunk boundaries.
    """
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = start + chunk_size
        chunk = text[start:end]
        
        # Only add non-empty chunks
        if chunk.strip():
            chunks.append({
                "doc_id": doc_id,
                "page": page_number,
                "text": chunk.strip(),
            })
            
        start += chunk_size - overlap
        
    return chunks
