import os
import json
import shutil
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.pdf.parser import extract_document
from backend.pdf.scan_detector import is_scanned_page
from backend.ocr.ocr_engine import ocr_page
from backend.ocr.ocr_engine import ocr_page
from backend.agent.controller import run_agent
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
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    # Save raw PDF
    doc_id = os.path.splitext(file.filename)[0]
    pdf_path = DOCUMENTS_DIR / file.filename
    
    with open(pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Process PDF
    try:
        output_dir = EXTRACTED_DIR / doc_id
        extracted_data = extract_document(str(pdf_path), str(output_dir))
        
        # Tag scanned pages and run OCR if necessary
        for page in extracted_data["pages"]:
            page["is_scanned"] = is_scanned_page(page["text"])
            if page["is_scanned"]:
                # The page is scanned, run OCR
                ocr_result = ocr_page(str(pdf_path), page["page_number"])
                page["text"] = ocr_result["text"]
                page["ocr_confidence"] = ocr_result["confidence"]
            
        # Save JSON output
        json_path = EXTRACTED_DIR / f"{doc_id}.json"
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(extracted_data, f, ensure_ascii=False, indent=2)
            
        return JSONResponse(status_code=200, content={
            "message": "Document uploaded and extracted successfully.",
            "doc_id": doc_id,
            "num_pages": extracted_data["num_pages"]
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "ok"}

class AskRequest(BaseModel):
    question: str
    doc_ids: Optional[List[str]] = None

@app.post("/agent/ask")
def ask_agent(req: AskRequest):
    try:
        # Run the full agent loop (Plan -> Retrieve -> Vision -> Reason -> Verify)
        result = run_agent(question=req.question, doc_ids=req.doc_ids)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
