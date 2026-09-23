from backend.rag.retriever import retrieve
from backend.rag.context_builder import build_context
from backend.agent.llm_client import generate

def compare_documents(topic: str, doc_id_a: str, doc_id_b: str) -> str:
    """
    Retrieves context for a specific topic across two documents and asks the LLM to compare them.
    """
    chunks_a = retrieve(topic, k=5, doc_ids=[doc_id_a])
    chunks_b = retrieve(topic, k=5, doc_ids=[doc_id_b])
    
    context = build_context(chunks_a + chunks_b)
    
    prompt = (
        f"Compare how these two documents address the following topic: {topic}\n\n"
        f"Context:\n{context}\n\n"
        "Ensure you cite which document each piece of information comes from."
    )
    
    return generate(prompt)
