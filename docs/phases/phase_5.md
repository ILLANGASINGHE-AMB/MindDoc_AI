# Phase 5: OCR for Scanned Documents

## Goal
The objective of Phase 5 is to introduce Optical Character Recognition (OCR) into our document processing pipeline. This enables the Agent to "read" scanned PDFs where text is baked into the image rather than stored as selectable characters.

## Architecture

```text
       PDF Page
          ↓
  Scan Detector (Phase 1)
          ↓
[Is Text length < Threshold?]
    │                   │
    ├─ NO ──────────────┤
    │                   │
   YES                  ↓
    │          Extract Native Text
    ↓                   │
Render to Image         │
    ↓                   │
 Tesseract OCR          │
    ↓                   │
  Extract Text          │
    │                   │
    └─────────┬─────────┘
              ↓
           Chunker (Phase 2)
```

## Key Components

1. **`backend/ocr/ocr_engine.py`**: Wraps the `pytesseract` library. It takes a PDF path and a specific page number, renders that page to an image using PyMuPDF at high DPI, and passes it through Tesseract to extract the text. It also calculates a confidence score.
2. **`backend/api/main.py (Updated)`**: We integrate the OCR engine directly into the upload route. During extraction, if `is_scanned_page` returns true for a page, the backend automatically hands that page over to the OCR engine instead of storing an empty string.

## Prerequisites
To run this phase successfully, you must install the Tesseract binary on your system:
- **macOS**: `brew install tesseract`
- **Linux**: `sudo apt-get install tesseract-ocr`
- **Windows**: Download the installer from the UB Mannheim repository.

## Outcomes
By the end of Phase 5, users can upload entirely scanned PDFs, and DocMind will silently run OCR on them during ingestion, allowing those documents to be searched and reasoned over just like digital PDFs.
