import os
import json
import shutil
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.pdf.parser import extract_document
from backend.pdf.scan_detector import is_scanned_page
from backend.ocr.ocr_engine import ocr_page, ocr_image
from backend.agent.controller import run_agent
from backend.agent.vision_client import describe_image
from backend.agent.llm_client import generate
from backend.rag.chunker import chunk_text
from backend.database.vector_store import add_chunks, clear_database
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="DocMind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev only, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path("data")
DOCUMENTS_DIR = DATA_DIR / "documents"
EXTRACTED_DIR = DATA_DIR / "extracted"

# Ensure directories exist
DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)

@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    filename = file.filename.lower()
    if not (filename.endswith('.pdf') or filename.endswith('.png') or filename.endswith('.jpg') or filename.endswith('.jpeg')):
        raise HTTPException(status_code=400, detail="Only PDF, PNG, JPG, and JPEG files are supported.")
    
    # Save raw file
    doc_id = os.path.splitext(file.filename)[0]
    file_path = DOCUMENTS_DIR / file.filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        all_chunks = []
        num_pages = 1
        
        if filename.endswith('.pdf'):
            # Process PDF
            output_dir = EXTRACTED_DIR / doc_id
            extracted_data = extract_document(str(file_path), str(output_dir))
            num_pages = extracted_data["num_pages"]
            
            # Tag scanned pages and run OCR if necessary
            for page in extracted_data["pages"]:
                page["is_scanned"] = is_scanned_page(page["text"])
                if page["is_scanned"]:
                    try:
                        ocr_result = ocr_page(str(file_path), page["page_number"])
                        page["text"] = ocr_result["text"]
                        page["ocr_confidence"] = ocr_result["confidence"]
                    except Exception as e:
                        print(f"OCR skipped for page {page['page_number']}: {str(e)}")
                        page["text"] = "[Scanned page - OCR unavailable]"
                        page["ocr_confidence"] = 0.0
                
            # Save JSON output
            json_path = EXTRACTED_DIR / f"{doc_id}.json"
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(extracted_data, f, ensure_ascii=False, indent=2)
                
            # Chunk and embed into Vector DB
            for page in extracted_data["pages"]:
                if page["text"] and not page["text"].startswith("[Scanned page - OCR unavailable]"):
                    chunks = chunk_text(page["text"], page_number=page["page_number"], doc_id=doc_id)
                    all_chunks.extend(chunks)
        else:
            # Process Image (PNG/JPG/JPEG)
            ocr_res = ocr_image(str(file_path))
            visual_desc = describe_image(str(file_path))
            
            combined_text = (
                f"--- Image Content ({file.filename}) ---\n\n"
                f"**Visual Description (AI Generated)**:\n{visual_desc}\n\n"
                f"**Extracted Text (OCR)**:\n{ocr_res['text']}\n"
            )
            
            chunks = chunk_text(combined_text, page_number=1, doc_id=doc_id)
            all_chunks.extend(chunks)
        
        if all_chunks:
            add_chunks(all_chunks)
            
        return JSONResponse(status_code=200, content={
            "message": "File uploaded and extracted successfully.",
            "doc_id": doc_id,
            "filename": file.filename,
            "num_pages": num_pages
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.delete("/documents/clear")
def clear_all_documents():
    try:
        clear_database()
        
        # Clear local files to completely reset memory
        for p in DOCUMENTS_DIR.glob("*"):
            if p.is_file(): p.unlink()
        for p in EXTRACTED_DIR.glob("*"):
            if p.is_file(): p.unlink()
            elif p.is_dir(): shutil.rmtree(p)
            
        return JSONResponse(status_code=200, content={"message": "All memory cleared."})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AskRequest(BaseModel):
    question: str
    doc_ids: Optional[List[str]] = None
    history: Optional[List[dict]] = []

@app.post("/agent/ask")
def ask_agent(req: AskRequest):
    try:
        # Run the full agent loop (Plan -> Retrieve -> Vision -> Reason -> Verify)
        result = run_agent(question=req.question, doc_ids=req.doc_ids, history=req.history)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/documents/{doc_id}/summarize")
def summarize_document(doc_id: str):
    try:
        json_path = EXTRACTED_DIR / f"{doc_id}.json"
        if not json_path.exists():
            raise HTTPException(status_code=404, detail="Document not found")
            
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        # Combine text from all pages
        full_text = "\n".join([p["text"] for p in data["pages"]])
        
        # Avoid overflowing context window if doc is huge
        # take first 15000 characters for a rough summary
        trunc_text = full_text[:15000]
        
        prompt = f"Summarize the following document in a concise, structured way:\n\n{trunc_text}"
        summary = generate(prompt, system="You are an expert at extracting and summarizing key information from documents.")
        
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{doc_id}/page/{page_number}")
def get_document_page(doc_id: str, page_number: int):
    try:
        json_path = EXTRACTED_DIR / f"{doc_id}.json"
        if not json_path.exists():
            raise HTTPException(status_code=404, detail="Document not found")
            
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        for page in data["pages"]:
            if page["page_number"] == page_number:
                return {"text": page["text"]}
                
        raise HTTPException(status_code=404, detail="Page not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
