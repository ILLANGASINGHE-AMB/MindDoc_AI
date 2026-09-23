def is_scanned_page(page_text: str, char_threshold: int = 20) -> bool:
    """
    Heuristic to determine if a page is scanned.
    A page with near-zero extractable text is likely a scan (or an image-heavy page).
    """
    return len(page_text.strip()) < char_threshold
