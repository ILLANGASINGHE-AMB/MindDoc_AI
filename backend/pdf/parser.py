import fitz  # PyMuPDF
from pathlib import Path

def extract_document(pdf_path: str, output_dir: str) -> dict:
    """
    Extracts text, images, and metadata from a PDF file page by page.
    """
    doc = fitz.open(pdf_path)
    result = {
        "metadata": doc.metadata, 
        "num_pages": doc.page_count, 
        "pages": []
    }

    img_dir = Path(output_dir) / "images"
    img_dir.mkdir(parents=True, exist_ok=True)

    for page_index in range(doc.page_count):
        page = doc.load_page(page_index)
        text = page.get_text("text")

        page_images = []
        for img_index, img in enumerate(page.get_images(full=True)):
            xref = img[0]
            base_image = doc.extract_image(xref)
            img_filename = f"page{page_index+1}_img{img_index+1}.{base_image['ext']}"
            img_path = img_dir / img_filename
            
            # Write image bytes to disk
            with open(img_path, "wb") as img_file:
                img_file.write(base_image["image"])
                
            page_images.append(str(img_path))

        result["pages"].append({
            "page_number": page_index + 1,
            "text": text,
            "char_count": len(text),
            "images": page_images,
        })
        
    doc.close()
    return result
