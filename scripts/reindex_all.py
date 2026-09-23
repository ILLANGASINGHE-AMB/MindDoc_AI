import os
import sys
import json
from pathlib import Path

# Add project root to python path so we can import backend modules
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from backend.rag.chunker import chunk_text
from backend.database.vector_store import add_chunks

EXTRACTED_DIR = project_root / "data" / "extracted"

def run_reindex():
    if not EXTRACTED_DIR.exists():
        print(f"Directory not found: {EXTRACTED_DIR}")
        return

    print("Starting vector database re-indexing...")
    total_docs = 0
    total_chunks = 0

    for json_file in EXTRACTED_DIR.glob("*.json"):
        doc_id = json_file.stem
        print(f"\nProcessing document: {doc_id}")
        
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            all_doc_chunks = []
            
            for page in data.get("pages", []):
                page_text = page.get("text", "")
                page_num = page.get("page_number", 0)
                
                # We skip empty pages or pages that were flagged as scanned
                # (Scanned pages will be processed in Phase 5 via OCR)
                if page_text and not page.get("is_scanned", False):
                    chunks = chunk_text(page_text, page_number=page_num, doc_id=doc_id)
                    all_doc_chunks.extend(chunks)
                    
            if all_doc_chunks:
                print(f"Generated {len(all_doc_chunks)} chunks. Generating embeddings and saving to ChromaDB...")
                add_chunks(all_doc_chunks)
                total_docs += 1
                total_chunks += len(all_doc_chunks)
            else:
                print(f"No extractable text found in {doc_id}.")
                
        except Exception as e:
            print(f"Error processing {json_file.name}: {str(e)}")

    print(f"\nRe-indexing complete! Indexed {total_docs} documents with a total of {total_chunks} chunks.")

if __name__ == "__main__":
    run_reindex()
