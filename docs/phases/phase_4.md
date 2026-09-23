# Phase 4: Retrieval-Augmented Generation (RAG) Pipeline

## Goal
The objective of Phase 4 is to combine the previous phases into a functioning "question answering" loop. This serves as the **MVP Checkpoint** for DocMind. We will build a pipeline that takes a user's question, searches the Vector Database for relevant document chunks, packages them into a context window, and asks the LLM to generate an answer based *only* on that context.

## Architecture

```text
User Question
      ↓
  Retriever
(Converts to Vector, searches ChromaDB)
      ↓
   Chunks
      ↓
 Context Builder
(Formats chunks into a single text prompt)
      ↓
  LLM Client
(Passes prompt to Ollama)
      ↓
Answer with Page References
```

## Key Components

1. **`backend/rag/retriever.py`**: A clean wrapper over the vector store search function. It abstracts away the vector search mechanics from the agent layer.
2. **`backend/rag/context_builder.py`**: A utility that takes a list of dictionary chunks (containing text, doc_id, and page numbers) and formats them into a structured text string. This ensures the LLM knows exactly which document and page a piece of information came from.
3. **`backend/api/main.py (Updated)`**: We will add a new endpoint `POST /agent/ask` which will accept a question, optionally filter by specific document IDs, and execute the RAG pipeline.

## Outcomes
By the end of Phase 4:
1. The backend will have a complete, end-to-end API for answering questions about the uploaded PDFs.
2. This establishes our baseline capabilities. All future phases (Agent logic, OCR, Vision) will build upon this functional core.
