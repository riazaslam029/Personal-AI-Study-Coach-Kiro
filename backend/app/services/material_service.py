"""Material extraction and validation service."""
from fastapi import UploadFile, HTTPException, status


# Allowed MIME types
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
}

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def validate_upload(file: UploadFile) -> None:
    """
    Validate uploaded file.
    Raises HTTPException (400) if:
    - MIME type not in allowlist
    - File size > 10 MB
    """
    # Check MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file.content_type}. "
                   f"Allowed types: PDF, TXT, Markdown",
        )

    # Check file size (FastAPI UploadFile doesn't have size until read, so we'll check during read)
    # Note: Size check will be done in the upload endpoint after reading


def extract_text_from_pdf(file_bytes: bytes) -> tuple[str, bool]:
    """
    Extract text from PDF using pypdf.
    Returns: (extracted_text, extraction_warning)
    extraction_warning is True if extracted text has < 50 chars.
    """
    try:
        from pypdf import PdfReader
        from io import BytesIO
    except ImportError:
        raise RuntimeError(
            "pypdf package is required for PDF extraction. "
            "Install with: pip install pypdf"
        )

    pdf_file = BytesIO(file_bytes)
    reader = PdfReader(pdf_file)

    text_parts = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            text_parts.append(text)

    extracted_text = "\n".join(text_parts)
    extraction_warning = len(extracted_text.strip()) < 50

    return extracted_text, extraction_warning


def extract_text_from_txt(file_bytes: bytes) -> str:
    """
    Decode plain text file.
    Tries UTF-8 first, falls back to latin-1.
    """
    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        # Fallback to latin-1 (never fails)
        return file_bytes.decode("latin-1")


def extract_text_from_markdown(file_bytes: bytes) -> str:
    """
    Decode markdown file as UTF-8.
    Markdown is always UTF-8.
    """
    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UTF-8 encoding in markdown file",
        )
