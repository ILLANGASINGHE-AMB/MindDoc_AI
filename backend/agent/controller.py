from backend.agent.planner import plan
from backend.rag.retriever import retrieve
from backend.rag.context_builder import build_context
from backend.vision.vision_engine import analyze_image
from backend.agent.llm_client import generate
from backend.agent.tools.verify_tool import verify_answer
import json

def run_agent(question: str, doc_ids: list[str] = None) -> dict:
    """
    The main orchestrator for the DocMind Agent.
    It plans, searches, gathers context (including vision), reasons, and verifies.
    """
    activity_log = []
    
    # 1. Plan
    p = plan(question)
    activity_log.append(f"Understood question. Plan: {json.dumps(p)}")
    
    all_chunks = []
    
    # 2. Execute Search for sub-queries
    sub_queries = p.get("sub_queries", [])
    if not sub_queries:
        sub_queries = [question]
        
    for sub_q in sub_queries:
        chunks = retrieve(sub_q, k=5, doc_ids=doc_ids)
        all_chunks.extend(chunks)
        activity_log.append(f"Searched: '{sub_q}' → {len(chunks)} chunks found")
        
    # Optional: Dedup chunks
    unique_chunks = []
    seen = set()
    for c in all_chunks:
        chunk_key = f"{c['doc_id']}_{c['page']}_{c['text'][:20]}"
        if chunk_key not in seen:
            seen.add(chunk_key)
            unique_chunks.append(c)
    
    # 3. Vision Integration (Simplified Mock for integration)
    vision_notes = []
    if p.get("needs_vision"):
        # In a real implementation, we would extract image references from the chunks
        # For MVP Agent integration, we log the intent.
        activity_log.append("Flagged pages for visual analysis (pending UI image selection or deeper chunk metadata)")
        
    # 4. Context Building
    context = build_context(unique_chunks)
    if vision_notes:
        context += "\n\nVisual analysis:\n" + "\n".join(vision_notes)
        
    # 5. Answer Generation
    system_prompt = (
        "You are DocMind, an expert AI document analysis assistant. "
        "The user has uploaded a document, and the text of that document has been extracted and provided to you in the Context section. "
        "Do NOT say you cannot read PDFs, access files, or view documents. The file's contents are already given to you in the Context. "
        "Read the Context and answer the user's question as if you are reading the document directly."
    )
    
    answer_prompt = (
        "Using ONLY the provided context, answer the user's question. "
        "Cite the document name and page number for every claim. "
        "If the context is insufficient or does not contain the answer, say so explicitly.\n\n"
        f"Context:\n{context}\n\nQuestion: {question}"
    )
    answer = generate(answer_prompt, system=system_prompt)
    activity_log.append("Generated draft answer")
    
    # 6. Verification
    verified = verify_answer(answer, context)
    if verified.get("supported", False):
        activity_log.append("Verification: supported")
    else:
        activity_log.append(f"Verification: NOT supported. Issues: {verified.get('unsupported_claims', [])}")
        # In a strict environment, we could rewrite the answer or reject it here
        answer += "\n\n[Agent Note: Some claims in this answer could not be strongly verified against the context.]"
        
    # 7. Collect sources for UI
    sources = []
    seen_sources = set()
    for c in unique_chunks:
        src_key = f"{c['doc_id']}_{c['page']}"
        if src_key not in seen_sources:
            seen_sources.add(src_key)
            sources.append({"doc_id": c["doc_id"], "page": c["page"]})
            
    return {
        "answer": answer,
        "sources": sources,
        "activity_log": activity_log
    }
