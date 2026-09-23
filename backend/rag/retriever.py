from backend.database.vector_store import search

def retrieve(question: str, k: int = 5, doc_ids: list[str] = None) -> list[dict]:
    """
    Given a question, retrieves the top 'k' most relevant chunks from the vector database.
    Optionally filter by a specific list of doc_ids.
    """
    return search(query=question, k=k, doc_ids=doc_ids)
