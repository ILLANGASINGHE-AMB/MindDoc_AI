# Phase 2: Local Knowledge Base

## Goal
The objective of Phase 2 is to convert the raw extracted text from Phase 1 into a searchable semantic knowledge base. We will achieve this by "chunking" the text into smaller segments, generating vector embeddings for each chunk, and storing them in a local Vector Database.

## Architecture

```text
data/extracted/<doc>.json
       ↓
     Chunker
(Splits text into ~800 char blocks)
       ↓
    Embedder
(Sentence-Transformers local model)
       ↓
   Vector DB
(ChromaDB in data/vector_db/)
```

## Key Components

1. **`backend/rag/chunker.py`**: A utility that takes the full text of a page and splits it into overlapping segments (chunks). Overlap prevents breaking sentences or concepts in half, which degrades search quality.
2. **`backend/embeddings/embedder.py`**: A wrapper around `sentence-transformers` (specifically the `all-MiniLM-L6-v2` model). This model runs entirely locally on CPU/GPU and turns text chunks into high-dimensional vectors representing semantic meaning.
3. **`backend/database/vector_store.py`**: Initializes a persistent local ChromaDB instance inside `data/vector_db/`. It provides methods to insert chunks and search for the most semantically relevant chunks given a text query.
4. **`scripts/reindex_all.py`**: A utility script to walk through all extracted JSON files from Phase 1, chunk them, embed them, and dump them into the Vector DB.

## Outcomes
By the end of Phase 2:
1. We will have a persistent vector database stored locally.
2. Documents can be algorithmically chunked and indexed.
3. We can perform a "semantic search" query against the database and retrieve the most relevant text snippets along with their source document ID and page numbers.
