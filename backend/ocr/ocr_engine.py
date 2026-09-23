import fitz
import pytesseract
from PIL import Image
import io

def ocr_page(pdf_path: str, page_number: int, dpi: int = 300) -> dict:
    """
    Renders a specific page of a PDF to an image and runs OCR to extract text.
    Returns the extracted text and a confidence score.
    """
    doc = fitz.open(pdf_path)
    
    # PyMuPDF is 0-indexed
    page = doc.load_page(page_number - 1)
    
    # Render page to a high-DPI pixmap
    pix = page.get_pixmap(dpi=dpi)
    
    # Convert to a PIL Image
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    
    # Extract data including confidence scores
    data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
    
    # Extract raw text
    text = pytesseract.image_to_string(img)
    
    # Calculate average confidence
    confidences = [int(c) for c in data["conf"] if str(c) != "-1"]
    avg_conf = sum(confidences) / len(confidences) if confidences else 0
    
    doc.close()
    
    return {
        "page": page_number,
        "text": text,
        "confidence": avg_conf
    }
