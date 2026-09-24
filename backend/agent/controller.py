from backend.agent.planner import plan
from backend.rag.retriever import retrieve
from backend.rag.context_builder import build_context
from backend.vision.vision_engine import analyze_image
from backend.agent.llm_client import generate
from backend.agent.tools.verify_tool import verify_answer
from backend.api.ws_manager import manager
import json

COMMAND_RESPONSES = {
    "/help": (
        "### 💻 DocMind Terminal Commands\n\n"
        "| Command | Description | Example |\n"
        "| :--- | :--- | :--- |\n"
        "| `/upload` | Add documents (PDF, DOCX, PPTX, XLSX, Images) to local memory | `/upload` |\n"
        "| `/ask <question>` | Ask questions about your documents or general topics | `/ask What is the revenue trend?` |\n"
        "| `/summarize [doc]` | Generate concise summaries of uploaded documents | `/summarize` |\n"
        "| `/help` | Show available commands and instructions | `/help` |\n"
        "| `/clear` | Clear all memory and reset the local database | `/clear` |\n\n"
        "*DocMind operates 100% offline with local AI embeddings, OCR, and reasoning.*"
    ),
    "/upload": (
        "📁 **Add Documents (`/upload`)**\n\n"
        "You can add documents to DocMind local memory using:\n"
        "1. **File Selector:** Click `[+ ADD FILES]` in the Documents tab or type `/upload` in the prompt.\n"
        "2. **Drag & Drop:** Drop any file directly into the terminal window.\n\n"
        "**Supported file formats:**\n"
        "- **PDF Documents** (`.pdf`) — Standard & scanned documents (with local OCR)\n"
        "- **Microsoft Office** (`.docx`, `.pptx`, `.xlsx`)\n"
        "- **Images** (`.png`, `.jpg`, `.jpeg`) — Analyzed via multimodal local vision"
    ),
    "/ask": (
        "💬 **Ask Questions (`/ask`)**\n\n"
        "**Usage:** `/ask <your question>`\n\n"
        "Ask questions about any uploaded documents or general topics. DocMind analyzes context, extracts evidence, and cites sources.\n\n"
        "**Examples:**\n"
        "- `/ask What are the key takeaways from the contract?`\n"
        "- `/ask Extract the quarterly revenue table`\n"
        "- `/ask Explain the diagram on page 5`\n\n"
        "*Tip: You can also type your question directly into the prompt without `/ask`.*"
    ),
    "/summarize": (
        "📝 **Document Summarization (`/summarize`)**\n\n"
        "**Usage:** `/summarize [document_name]`\n\n"
        "Generates a concise, structured executive summary of your documents.\n\n"
        "**How to summarize:**\n"
        "- Navigate to the **Documents** tab and click the **[SUMMARIZE]** button next to any file.\n"
        "- Or type `/summarize <document_name>` in the prompt."
    ),
    "/clear": (
        "⚙️ **Clear Memory (`/clear`)**\n\n"
        "To clear all conversation history, extracted files, and vector embeddings, use the **Clear Memory** button in the sidebar or confirm the reset."
    )
}

def run_agent(question: str, doc_ids: list[str] = None, history: list = None) -> dict:
    """
    The main orchestrator for the DocMind Agent.
    It plans, searches, gathers context (including vision), reasons, and verifies.
    """
    manager.emit_event("understanding", "Received query, starting analysis...")
    activity_log = []
    
    q_clean = question.strip()
    q_lower = q_clean.lower()

    # 0. Instant Built-in Slash Commands (Zero-latency saved responses)
    if q_lower in COMMAND_RESPONSES:
        return {
            "answer": COMMAND_RESPONSES[q_lower],
            "sources": [],
            "activity_log": [f"Command '{q_lower}' executed (instant saved answer)"]
        }
    
    if q_lower.startswith("/ask "):
        q_clean = q_clean[5:].strip()
        if not q_clean:
            return {
                "answer": COMMAND_RESPONSES["/ask"],
                "sources": [],
                "activity_log": ["Command '/ask' executed (instant saved answer)"]
            }
        question = q_clean

    # 1. Plan
    manager.emit_event("understanding", "Planning execution steps...")
    p = plan(question)
    manager.emit_event("searching", f"Plan generated with {len(p.get('sub_queries', []))} sub-queries.")
    activity_log.append(f"Understood question. Plan: {json.dumps(p)}")
    
    all_chunks = []
    
    # 2. Execute Search for sub-queries
    sub_queries = p.get("sub_queries", [])
    if not sub_queries:
        sub_queries = [question]
        
    for sub_q in sub_queries:
        manager.emit_event("searching", f"Searching documents for: '{sub_q}'...")
        chunks = retrieve(sub_q, k=5, doc_ids=doc_ids)
        all_chunks.extend(chunks)
        manager.emit_event("retrieving", f"Found {len(chunks)} relevant chunks for '{sub_q}'.")
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
        manager.emit_event("vision", "Flagging pages for visual analysis...")
        # In a real implementation, we would extract image references from the chunks
        # For MVP Agent integration, we log the intent.
        activity_log.append("Flagged pages for visual analysis (pending UI image selection or deeper chunk metadata)")
        
    # 4. Context Building
    context = build_context(unique_chunks)
    if vision_notes:
        context += "\n\nVisual analysis:\n" + "\n".join(vision_notes)
        
    # 5. Answer Generation
    system_prompt = (
        "You are DocMind, a highly intelligent, fully local, and completely offline AI assistant. "
        "You run entirely on the user's device, ensuring 100% privacy and security. You do not use the cloud or send data over the internet. "
        "You help users analyze documents, but you are also fully capable of general conversation. "
        "The system supports built-in terminal slash commands:\n"
        "- /upload : to add documents (PDF, DOCX, PPTX, XLSX, Images)\n"
        "- /ask <question> : to ask questions about uploaded documents or general inquiries\n"
        "- /summarize [doc] : to generate concise executive summaries of documents\n"
        "- /help : to list available commands and usage instructions\n"
        "- /clear : to reset memory and clear indexed documents\n"
        "When context from documents is provided and relevant, prioritize answering from the context and cite the document name and page number. "
        "If the user is asking a general question, greeting you, or if no context is provided, you MUST rely on your own general knowledge to answer naturally without apologizing or mentioning the lack of documents."
    )
    
    if context.strip():
        answer_prompt = f"Context from uploaded documents:\n{context}\n\nUser Question: {question}"
    else:
        answer_prompt = f"User Question: {question}"
        
    manager.emit_event("reasoning", "Synthesizing information and generating draft answer...")
    answer = generate(answer_prompt, system=system_prompt, history=history)
    activity_log.append("Generated draft answer")
    
    # 6. Verification (Only verify if there was context and the user wasn't just chatting)
    if unique_chunks:
        manager.emit_event("verifying", "Verifying generated answer against retrieved evidence...")
        verified = verify_answer(answer, context)
        if verified.get("supported", False):
            activity_log.append("Verification: supported")
        else:
            activity_log.append(f"Verification: NOT supported. Issues: {verified.get('unsupported_claims', [])}")
            # Only append note if the answer explicitly tries to cite something not in context
            if "page" in answer.lower() or "document" in answer.lower():
                answer += "\n\n*Agent Note: Some claims in this answer could not be strongly verified against the document context.*"
                
    manager.emit_event("answering", "Finalizing response...")

    # 7. Collect sources for UI
    sources = []
    seen_sources = set()
    for c in unique_chunks:
        src_key = f"{c['doc_id']}_{c['page']}"
        if src_key not in seen_sources:
            seen_sources.add(src_key)
            sources.append({"doc_id": c["doc_id"], "page": c["page"]})
            
    manager.emit_event("complete", "Response complete.")
    return {
        "answer": answer,
        "sources": sources,
        "activity_log": activity_log
    }
