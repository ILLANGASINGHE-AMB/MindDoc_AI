import os
import json
import shutil
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from backend.pdf.parser import extract_document
from backend.pdf.scan_detector import is_scanned_page

app = FastAPI(title="DocMind API")

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
        
        # Tag scanned pages
        for page in extracted_data["pages"]:
            page["is_scanned"] = is_scanned_page(page["text"])
            
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
