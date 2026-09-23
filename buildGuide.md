# DocMind — Build Guide

> **Offline Multimodal AI Agent for Intelligent PDF Understanding**
> This guide turns the DocMind design document into an actionable, step-by-step build plan: stack decisions, environment setup, folder structure, phase-by-phase implementation with code, API contracts, testing, and deployment.

---

## Table of Contents

1. [Architecture Recap](#1-architecture-recap)
2. [Final Technology Stack](#2-final-technology-stack)
3. [Prerequisites & Environment Setup](#3-prerequisites--environment-setup)
4. [Project Structure](#4-project-structure)
5. [Phase 1 — PDF Processing](#5-phase-1--pdf-processing)
6. [Phase 2 — Local Knowledge Base (Chunking + Embeddings + Vector DB)](#6-phase-2--local-knowledge-base)
7. [Phase 3 — Local LLM Integration](#7-phase-3--local-llm-integration)
8. [Phase 4 — RAG Pipeline](#8-phase-4--rag-pipeline)
9. [Phase 5 — OCR for Scanned Documents](#9-phase-5--ocr-for-scanned-documents)
10. [Phase 6 — Multimodal Processing (Vision)](#10-phase-6--multimodal-processing-vision)
11. [Phase 7 — AI Agent Layer](#11-phase-7--ai-agent-layer)
12. [Phase 8 — Frontend / UI](#12-phase-8--frontend--ui)
13. [Phase 9 — Optimization](#13-phase-9--optimization)
14. [API Reference](#14-api-reference)
15. [Hardware-Aware Model Selection](#15-hardware-aware-model-selection)
16. [Testing & Evaluation](#16-testing--evaluation)
17. [Security & Privacy Checklist](#17-security--privacy-checklist)
18. [Running the Full Stack](#18-running-the-full-stack)
19. [Troubleshooting](#19-troubleshooting)
20. [Roadmap Beyond MVP](#20-roadmap-beyond-mvp)

---

## 1. Architecture Recap

```text
User → UI (React) → FastAPI Backend → Agent Core
                                          │
                     ┌────────────────────┼────────────────────┐
                     ↓                    ↓                    ↓
              PDF Search Tool       Vision Tool           OCR Tool
                     │                    │                    │
              Vector DB (Chroma)   Local Vision Model    Tesseract/PaddleOCR
                     │                    │                    │
                     └────────────────────┼────────────────────┘
                                          ↓
                                    Local LLM (Ollama)
                                          ↓
                                Answer + Page References
```

Everything below the UI layer runs **entirely on the local machine**; no document content or query leaves the host during normal operation.

---

## 2. Final Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Fast dev loop, typed UI, easy component structure |
| Styling | Tailwind CSS | Rapid, consistent UI without heavy custom CSS |
| Backend API | Python 3.11 + FastAPI + Uvicorn | Async, first-class Python AI ecosystem, auto OpenAPI docs |
| Agent Orchestration | Custom Python agent controller (LangGraph optional for v2) | Full transparency for an academic/portfolio project; LangGraph can replace it later without changing tool interfaces |
| Local LLM Runtime | **Ollama** | Simplest local model management (`ollama pull`, `ollama run`), OpenAI-compatible API |
| Recommended LLM | `qwen2.5:7b-instruct` (mid-range) / `llama3.1:8b-instruct` (alt) / `qwen2.5:3b-instruct` (low-end) | Strong reasoning-to-size ratio, runs on 8–16GB RAM in quantized form |
| Local Vision Model | `qwen2.5vl:7b` via Ollama, or `llava:7b` | Multimodal VQA for figures/diagrams/charts/tables |
| Embedding Model | `nomic-embed-text` (via Ollama) or `sentence-transformers/all-MiniLM-L6-v2` (via `sentence-transformers`) | Fast, small, good semantic recall, fully local |
| Vector Database | **ChromaDB** (embedded, persistent) | Zero external service, simple Python API, good for a single-user desktop app. Swap to Qdrant/FAISS for scale later |
| PDF Parsing | **PyMuPDF (fitz)** primary, `pdfplumber` for table-heavy pages | Fast text + image extraction + page rendering to images |
| OCR Engine | **Tesseract OCR** via `pytesseract` (default), **PaddleOCR** as optional higher-accuracy backend | Tesseract is simplest to install offline; PaddleOCR is more accurate on complex scans |
| Table Extraction | `pdfplumber` / `camelot-py` (optional) | Structured table cell extraction |
| Agent Memory / State | SQLite (`sqlite3` / SQLAlchemy) | Lightweight local store for chat history, doc metadata, indexing status |
| File Storage | Local filesystem (`data/documents`, `data/extracted`) | No cloud storage dependency |
| Packaging | `pip` + `venv` (backend), `npm`/`pnpm` (frontend) | Standard, no extra infra |
| Testing | `pytest` (backend), `vitest` + `React Testing Library` (frontend) | Standard local-first testing |
| Containerization (optional) | Docker Compose | Reproducible local deployment across machines |

> **Design rule:** every layer above must have a fully offline execution path once installed. Any cloud fallback (e.g., a hosted LLM) must be explicitly opt-in and clearly labeled in Settings.

---

## 3. Prerequisites & Environment Setup

### 3.1 System requirements

```text
Minimum:  4+ core CPU, 8GB RAM, SSD, GPU optional
Recommended: 6–8+ core CPU, 16–32GB RAM, 8GB+ VRAM GPU, SSD
```

### 3.2 Install core tools

```bash
# Python
python3 --version        # need 3.11+
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Node
node --version            # need 18+
npm --version

# Ollama (local LLM runtime)
# macOS/Linux:
curl -fsSL https://ollama.com/install.sh | sh
# Windows: download installer from https://ollama.com

# Tesseract OCR
# macOS:   brew install tesseract
# Ubuntu:  sudo apt-get install tesseract-ocr
# Windows: install from https://github.com/UB-Mannheim/tesseract/wiki
```

### 3.3 Pull local models

```bash
ollama pull qwen2.5:7b-instruct      # reasoning LLM
ollama pull qwen2.5vl:7b             # vision model (or: ollama pull llava:7b)
ollama pull nomic-embed-text         # embedding model
```

### 3.4 Backend Python dependencies

```bash
pip install fastapi uvicorn[standard] \
    pymupdf pdfplumber pypdf \
    pytesseract pillow \
    chromadb sentence-transformers \
    ollama \
    sqlalchemy python-multipart \
    pydantic pydantic-settings \
    pytest httpx
```

### 3.5 Frontend dependencies

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install axios react-pdf zustand
```

---

## 4. Project Structure

```text
docmind/
│
├── frontend/
│   ├── src/
│   │   ├── components/       # DocumentList, PdfViewer, ChatPanel, AgentActivity
│   │   ├── pages/             # Dashboard, DocumentManager, AgentChat, Settings
│   │   ├── services/          # api.ts (axios client)
│   │   └── store/              # zustand state
│   └── package.json
│
├── backend/
│   ├── api/
│   │   ├── main.py             # FastAPI app entrypoint
│   │   ├── routes_documents.py
│   │   ├── routes_agent.py
│   │   └── routes_settings.py
│   ├── agent/
│   │   ├── planner.py          # question understanding + planning
│   │   ├── controller.py       # agent loop / orchestration
│   │   ├── tools/
│   │   │   ├── search_tool.py
│   │   │   ├── ocr_tool.py
│   │   │   ├── vision_tool.py
│   │   │   ├── compare_tool.py
│   │   │   └── verify_tool.py
│   │   └── memory.py
│   ├── rag/
│   │   ├── chunker.py
│   │   ├── retriever.py
│   │   └── context_builder.py
│   ├── pdf/
│   │   ├── parser.py            # PyMuPDF text/image/page extraction
│   │   └── scan_detector.py     # decide if OCR is needed
│   ├── ocr/
│   │   └── ocr_engine.py
│   ├── vision/
│   │   └── vision_engine.py
│   ├── embeddings/
│   │   └── embedder.py
│   ├── database/
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── vector_store.py      # Chroma wrapper
│   │   └── session.py
│   └── config.py
│
├── models/                     # (optional local model cache references)
├── data/
│   ├── documents/               # raw uploaded PDFs
│   ├── extracted/               # extracted text/images/tables per doc
│   └── vector_db/                # Chroma persistent storage
│
├── tests/
│   ├── test_pdf_parser.py
│   ├── test_rag.py
│   └── test_agent.py
│
├── scripts/
│   ├── setup_models.sh
│   └── reindex_all.py
│
├── config/
│   └── settings.yaml
│
├── docs/
│   └── DocMind.md               # original design doc
│
├── docker-compose.yml           # optional
└── README.md
```

---

## 5. Phase 1 — PDF Processing

**Goal:** upload → parse → extract text, images, and metadata per page.

`backend/pdf/parser.py`

```python
import fitz  # PyMuPDF
from pathlib import Path

def extract_document(pdf_path: str, output_dir: str) -> dict:
    doc = fitz.open(pdf_path)
    result = {"metadata": doc.metadata, "num_pages": doc.page_count, "pages": []}

    img_dir = Path(output_dir) / "images"
    img_dir.mkdir(parents=True, exist_ok=True)

    for page_index in range(doc.page_count):
        page = doc.load_page(page_index)
        text = page.get_text("text")

        page_images = []
        for img_index, img in enumerate(page.get_images(full=True)):
            xref = img[0]
            base_image = doc.extract_image(xref)
            img_path = img_dir / f"page{page_index+1}_img{img_index+1}.{base_image['ext']}"
            img_path.write_bytes(base_image["image"])
            page_images.append(str(img_path))

        result["pages"].append({
            "page_number": page_index + 1,
            "text": text,
            "char_count": len(text),
            "images": page_images,
        })
    doc.close()
    return result
```

`backend/pdf/scan_detector.py`

```python
def is_scanned_page(page_text: str, char_threshold: int = 20) -> bool:
    """Heuristic: a page with near-zero extractable text is likely a scan."""
    return len(page_text.strip()) < char_threshold
```

**Deliverable of this phase:** `POST /documents/upload` accepts a PDF, stores it in `data/documents/`, runs `extract_document`, and saves structured output to `data/extracted/<doc_id>.json`.

---

## 6. Phase 2 — Local Knowledge Base

**Goal:** chunk extracted text → embed → store in a persistent local vector DB.

`backend/rag/chunker.py`

```python
def chunk_text(text: str, page_number: int, doc_id: str,
                chunk_size: int = 800, overlap: int = 150) -> list[dict]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if chunk.strip():
            chunks.append({
                "doc_id": doc_id,
                "page": page_number,
                "text": chunk,
            })
        start += chunk_size - overlap
    return chunks
```

`backend/embeddings/embedder.py`

```python
import ollama

def embed_text(text: str, model: str = "nomic-embed-text") -> list[float]:
    response = ollama.embeddings(model=model, prompt=text)
    return response["embedding"]
```

`backend/database/vector_store.py`

```python
import chromadb
from backend.embeddings.embedder import embed_text

client = chromadb.PersistentClient(path="data/vector_db")
collection = client.get_or_create_collection("docmind_chunks")

def add_chunks(chunks: list[dict]):
    ids, embeddings, metadatas, documents = [], [], [], []
    for i, c in enumerate(chunks):
        cid = f"{c['doc_id']}_p{c['page']}_c{i}"
        ids.append(cid)
        embeddings.append(embed_text(c["text"]))
        metadatas.append({"doc_id": c["doc_id"], "page": c["page"]})
        documents.append(c["text"])
    collection.add(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=documents)

def search(query: str, k: int = 5, doc_ids: list[str] | None = None) -> list[dict]:
    query_embedding = embed_text(query)
    where = {"doc_id": {"$in": doc_ids}} if doc_ids else None
    results = collection.query(query_embeddings=[query_embedding], n_results=k, where=where)
    return [
        {"text": doc, "page": meta["page"], "doc_id": meta["doc_id"], "score": dist}
        for doc, meta, dist in zip(
            results["documents"][0], results["metadatas"][0], results["distances"][0]
        )
    ]
```

**Deliverable:** `scripts/reindex_all.py` walks `data/extracted/`, chunks each document, and calls `add_chunks`.

---

## 7. Phase 3 — Local LLM Integration

`backend/agent/llm_client.py`

```python
import ollama

def generate(prompt: str, model: str = "qwen2.5:7b-instruct",
             system: str | None = None) -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    response = ollama.chat(model=model, messages=messages)
    return response["message"]["content"]
```

Basic QA (pre-agent, for the MVP smoke test):

```python
from backend.database.vector_store import search
from backend.agent.llm_client import generate

def basic_qa(question: str) -> str:
    chunks = search(question, k=5)
    context = "\n\n".join(f"[Page {c['page']}] {c['text']}" for c in chunks)
    prompt = f"Answer using only the context below. Cite page numbers.\n\nContext:\n{context}\n\nQuestion: {question}"
    return generate(prompt)
```

---

## 8. Phase 4 — RAG Pipeline

`backend/rag/context_builder.py`

```python
def build_context(chunks: list[dict], max_chars: int = 6000) -> str:
    context, used = [], 0
    for c in chunks:
        entry = f"[{c['doc_id']} — Page {c['page']}]\n{c['text']}\n"
        if used + len(entry) > max_chars:
            break
        context.append(entry)
        used += len(entry)
    return "\n".join(context)
```

`backend/rag/retriever.py`

```python
from backend.database.vector_store import search

def retrieve(question: str, k: int = 6, doc_ids=None) -> list[dict]:
    return search(question, k=k, doc_ids=doc_ids)
```

Full RAG flow: `Question → embed_text → vector search → build_context → generate()`. This is wired into the Agent's `search_tool` in Phase 7, rather than called directly — the Agent decides *when* to retrieve.

---

## 9. Phase 5 — OCR for Scanned Documents

`backend/ocr/ocr_engine.py`

```python
import fitz
import pytesseract
from PIL import Image
import io

def ocr_page(pdf_path: str, page_number: int, dpi: int = 300) -> dict:
    doc = fitz.open(pdf_path)
    page = doc.load_page(page_number - 1)
    pix = page.get_pixmap(dpi=dpi)
    img = Image.open(io.BytesIO(pix.tobytes("png")))

    data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
    text = pytesseract.image_to_string(img)
    confidences = [int(c) for c in data["conf"] if c != "-1"]
    avg_conf = sum(confidences) / len(confidences) if confidences else 0

    doc.close()
    return {"page": page_number, "text": text, "confidence": avg_conf}
```

Pipeline integration: during Phase 1 extraction, if `is_scanned_page()` is true for a page, call `ocr_page()` instead of relying on `page.get_text()`, and flag the page as `"source": "ocr"` with its confidence score for later inspection.

---

## 10. Phase 6 — Multimodal Processing (Vision)

`backend/vision/vision_engine.py`

```python
import ollama
import base64

def analyze_image(image_path: str, question: str,
                   model: str = "qwen2.5vl:7b") -> str:
    with open(image_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode("utf-8")

    response = ollama.chat(
        model=model,
        messages=[{
            "role": "user",
            "content": question,
            "images": [img_b64],
        }],
    )
    return response["message"]["content"]
```

Typical prompts used by the Vision Tool:

- *"Describe this figure in detail, including any labels, axes, and relationships shown."*
- *"This is a table extracted from a document. List its rows and columns as structured data."*
- *"This is a chart. Describe the trend it shows and any notable values."*

---

## 11. Phase 7 — AI Agent Layer

This is the core differentiator from a plain RAG chatbot: the Agent decides **which tools to call and in what order**.

### 11.1 Tool interface (shared contract)

`backend/agent/tools/base.py`

```python
from abc import ABC, abstractmethod

class AgentTool(ABC):
    name: str
    description: str

    @abstractmethod
    def run(self, **kwargs) -> dict:
        ...
```

### 11.2 Planner — question understanding

`backend/agent/planner.py`

```python
from backend.agent.llm_client import generate
import json

PLANNER_SYSTEM_PROMPT = """You are a planning module for a document AI agent.
Given a user question, output a JSON plan with these fields:
- needs_search: bool
- needs_ocr: bool
- needs_vision: bool
- needs_comparison: bool
- sub_queries: list of strings (specific things to search for)
Respond with JSON only."""

def plan(question: str) -> dict:
    raw = generate(question, system=PLANNER_SYSTEM_PROMPT)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: assume a standard search is always needed
        return {"needs_search": True, "needs_ocr": False,
                "needs_vision": False, "needs_comparison": False,
                "sub_queries": [question]}
```

### 11.3 Controller — the agent loop

`backend/agent/controller.py`

```python
from backend.agent.planner import plan
from backend.rag.retriever import retrieve
from backend.rag.context_builder import build_context
from backend.vision.vision_engine import analyze_image
from backend.agent.llm_client import generate
from backend.agent.tools.verify_tool import verify_answer

def run_agent(question: str, doc_ids: list[str] | None = None) -> dict:
    activity_log = []
    p = plan(question)
    activity_log.append(f"Understood question. Plan: {p}")

    all_chunks = []
    for sub_q in p.get("sub_queries", [question]):
        chunks = retrieve(sub_q, k=5, doc_ids=doc_ids)
        all_chunks.extend(chunks)
        activity_log.append(f"Searched: '{sub_q}' → {len(chunks)} chunks found")

    vision_notes = []
    if p.get("needs_vision"):
        # Identify candidate figures near top-matching chunks (simplified)
        for c in all_chunks[:2]:
            # image path lookup would come from data/extracted/<doc_id>.json
            activity_log.append(f"Flagged page {c['page']} for visual analysis")

    context = build_context(all_chunks)
    if vision_notes:
        context += "\n\nVisual analysis:\n" + "\n".join(vision_notes)

    answer_prompt = (
        "Answer the question using ONLY the context. "
        "Cite document and page for every claim. "
        "If the context is insufficient, say so explicitly.\n\n"
        f"Context:\n{context}\n\nQuestion: {question}"
    )
    answer = generate(answer_prompt)
    activity_log.append("Generated draft answer")

    verified = verify_answer(answer, context)
    activity_log.append(f"Verification: {'supported' if verified['supported'] else 'NOT supported'}")

    if not verified["supported"]:
        answer = "The available documents do not contain sufficient information to answer this question confidently."

    sources = [{"doc_id": c["doc_id"], "page": c["page"]} for c in all_chunks]

    return {
        "answer": answer,
        "sources": sources,
        "activity_log": activity_log,
    }
```

### 11.4 Verification tool (hallucination reduction)

`backend/agent/tools/verify_tool.py`

```python
from backend.agent.llm_client import generate
import json

VERIFY_PROMPT = """Given the CONTEXT and the ANSWER below, determine whether every
claim in the ANSWER is supported by the CONTEXT. Respond as JSON:
{{"supported": true/false, "unsupported_claims": [...]}}

CONTEXT:
{context}

ANSWER:
{answer}
"""

def verify_answer(answer: str, context: str) -> dict:
    raw = generate(VERIFY_PROMPT.format(context=context, answer=answer))
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"supported": True, "unsupported_claims": []}  # fail-open for MVP; tighten later
```

### 11.5 Comparison tool (multi-document reasoning)

`backend/agent/tools/compare_tool.py`

```python
from backend.rag.retriever import retrieve
from backend.rag.context_builder import build_context
from backend.agent.llm_client import generate

def compare_documents(topic: str, doc_id_a: str, doc_id_b: str) -> str:
    chunks_a = retrieve(topic, k=5, doc_ids=[doc_id_a])
    chunks_b = retrieve(topic, k=5, doc_ids=[doc_id_b])
    context = build_context(chunks_a + chunks_b)
    prompt = f"Compare how these two documents address: {topic}\n\nContext:\n{context}"
    return generate(prompt)
```

---

## 12. Phase 8 — Frontend / UI

### 12.1 Key screens

- **Dashboard** — total documents, indexed pages, model status, storage usage
- **Document Manager** — upload/delete/rename PDFs, re-index, view metadata
- **Agent Chat** — question input, live agent activity feed, answer, clickable source list
- **PDF Viewer** — page navigation, jump-to-page from a source citation
- **Settings** — LLM/vision/embedding model pickers, OCR toggle, storage path

### 12.2 Minimal API client

`frontend/src/services/api.ts`

```ts
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000" });

export const uploadDocument = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/documents/upload", form);
};

export const askAgent = (question: string, docIds?: string[]) =>
  api.post("/agent/ask", { question, doc_ids: docIds });

export const listDocuments = () => api.get("/documents");
```

### 12.3 Agent activity panel (concept)

```tsx
function AgentActivity({ log }: { log: string[] }) {
  return (
    <ul className="text-sm text-gray-600 space-y-1">
      {log.map((step, i) => (
        <li key={i}>✓ {step}</li>
      ))}
    </ul>
  );
}
```

---

## 13. Phase 9 — Optimization

- **Quantized models:** use `q4_K_M`/`q4_0` GGUF variants via Ollama for constrained hardware.
- **Caching:** cache embeddings per chunk hash so re-uploads of an unchanged PDF skip re-embedding.
- **Batch embedding:** embed chunks in batches rather than one call per chunk where the embedding backend supports it.
- **Async I/O:** use FastAPI `async def` routes + background tasks for indexing so uploads don't block the UI.
- **Vector search tuning:** limit `k`, use metadata filters (`doc_id`) to shrink search space for multi-doc collections.
- **GPU offload:** Ollama automatically uses GPU when available — expose a Settings toggle to force CPU-only mode for low-power machines.

---

## 14. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/documents/upload` | Upload a PDF, trigger extraction + indexing |
| `GET` | `/documents` | List documents with metadata + indexing status |
| `DELETE` | `/documents/{doc_id}` | Remove a document and its vectors |
| `POST` | `/documents/{doc_id}/reindex` | Re-run extraction + embedding |
| `POST` | `/agent/ask` | `{ question, doc_ids? }` → `{ answer, sources, activity_log }` |
| `GET` | `/documents/{doc_id}/page/{n}` | Return rendered page image for the viewer |
| `GET` | `/settings` / `PUT` | Read/update model + storage settings |
| `GET` | `/health` | Backend + model availability check |

Example request/response:

```json
POST /agent/ask
{ "question": "Why did the proposed architecture outperform the baseline?", "doc_ids": ["paper_a"] }

200 OK
{
  "answer": "The proposed architecture reduces processing overhead by introducing parallel stages...",
  "sources": [
    { "doc_id": "paper_a", "page": 12 },
    { "doc_id": "paper_a", "page": 18 }
  ],
  "activity_log": [
    "Understood question. Plan: {...}",
    "Searched: 'proposed architecture performance' → 5 chunks found",
    "Generated draft answer",
    "Verification: supported"
  ]
}
```

---

## 15. Hardware-Aware Model Selection

`backend/config.py` (concept)

```python
import psutil

def recommend_models() -> dict:
    ram_gb = psutil.virtual_memory().total / (1024 ** 3)
    if ram_gb >= 32:
        return {"llm": "qwen2.5:14b-instruct", "vision": "qwen2.5vl:7b"}
    elif ram_gb >= 16:
        return {"llm": "qwen2.5:7b-instruct", "vision": "qwen2.5vl:7b"}
    else:
        return {"llm": "qwen2.5:3b-instruct", "vision": "llava:7b"}
```

Surface this in Settings as a one-click "recommended configuration" the user can accept or override.

---

## 16. Testing & Evaluation

| Dimension | Metric | How |
|---|---|---|
| Retrieval accuracy | Precision@K, Recall@K, MRR | Curated question/answer set with known source pages |
| Answer accuracy | Human-graded correctness | Compare agent answers to reference answers |
| Source grounding | % claims traceable to cited pages | Manual or LLM-assisted claim-checking |
| OCR accuracy | Character/word error rate | Compare OCR text to ground-truth transcription on sample scans |
| Multimodal QA | Accuracy on figure/table/chart questions | Dedicated eval set per modality |
| Performance | Indexing time, query latency, RAM/CPU/GPU usage | `pytest-benchmark` + system monitoring |
| Offline reliability | Zero outbound network calls during normal ops | Run with network disabled and confirm no failures |

```bash
pytest tests/ -v
```

---

## 17. Security & Privacy Checklist

- [ ] All document storage stays under `data/` on the local disk
- [ ] No outbound network calls in the document/query path (verify with network disabled)
- [ ] Uploaded files validated (MIME type, size limit) before processing
- [ ] Temporary files cleaned up after each request
- [ ] Optional: encrypt `data/vector_db` and `data/documents` at rest
- [ ] Local API bound to `127.0.0.1` by default, not `0.0.0.0`
- [ ] "Secure delete" removes both the PDF and its vector entries

---

## 18. Running the Full Stack

```bash
# Terminal 1 — Ollama (usually runs as a background service after install)
ollama serve

# Terminal 2 — Backend
cd backend
source ../.venv/bin/activate
uvicorn api.main:app --reload --port 8000

# Terminal 3 — Frontend
cd frontend
npm run dev
```

Optional Docker Compose (`docker-compose.yml`) can wrap backend + frontend for one-command startup; Ollama typically stays as a host-level service since it benefits from direct GPU access.

---

## 19. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `ollama.chat` connection refused | Ollama service not running | `ollama serve`, confirm `http://localhost:11434` responds |
| Empty text on a page that looks readable | Scanned page not detected | Lower `char_threshold` in `is_scanned_page`, force OCR |
| Slow first query | Model loading into memory on first call | Warm up with a dummy request on backend startup |
| Vision model gives generic answers | Image resolution too low | Increase `dpi` in page rendering before passing to vision model |
| Out-of-memory on load | Model too large for available RAM/VRAM | Switch to a smaller quantized model via hardware-aware selection |

---

## 20. Roadmap Beyond MVP

1. Voice interaction (speech-to-text → agent → text-to-speech)
2. Automatic document summaries on upload
3. Auto-generated study notes / flashcards / MCQs
4. Exam mode (question generation with difficulty levels)
5. Cross-document knowledge graph
6. Citation generator
7. Expand supported formats: DOCX, PPTX, TXT, CSV, images, code, archived web pages — evolving DocMind into a general **Offline Personal Knowledge Agent**

---

### Build Order Summary

```text
1. PDF Processing        →  2. Knowledge Base (RAG storage)
3. Local LLM             →  4. RAG Q&A (MVP checkpoint)
5. OCR                   →  6. Vision / Multimodal
7. Agent Layer           →  8. UI
9. Optimization          →  Advanced features
```

Ship the **MVP checkpoint** (Phases 1–4: upload → text extraction → embeddings → vector DB → local LLM → basic RAG Q&A with page references) before adding OCR, vision, and the full agent loop. This keeps development risk low and gives a working demo early.
