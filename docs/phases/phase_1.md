# Phase 1: PDF Processing

## Goal
The objective of Phase 1 is to establish the foundation for Document Ingestion. We will build an API that allows users to upload PDF documents, parses those documents, and extracts text, images, and metadata page-by-page.

## Architecture

```text
POST /documents/upload
       ↓
  FastAPI Route
       ↓
  Save to data/documents/
       ↓
  PyMuPDF Parser
       │
       ├─ Extract Text per page
       ├─ Extract Images per page
       └─ Extract Metadata
       ↓
  Save JSON to data/extracted/
```

## Key Components

1. **`backend/api/main.py`**: The entrypoint for our FastAPI application. It handles the routing and incoming multipart file uploads.
2. **`backend/pdf/parser.py`**: The core extraction logic. It uses `PyMuPDF (fitz)` to open the PDF, iterate through pages, extract the text payload, and dump embedded images to disk.
3. **`backend/pdf/scan_detector.py`**: A heuristic module that checks if a page is likely a scanned image rather than a digital document. If a page has very few text characters but contains images, it is flagged so that we know OCR will be required in a future phase.

## Outcomes
By the end of this phase, uploading a PDF will result in:
1. The raw PDF saved in `data/documents/`.
2. Extracted images saved in `data/extracted/images/`.
3. A structured JSON file saved in `data/extracted/<filename>.json` containing page-by-page text, character counts, and image paths.
