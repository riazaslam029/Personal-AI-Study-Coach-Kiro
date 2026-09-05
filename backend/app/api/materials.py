"""Study material CRUD endpoints."""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.course import Course
from app.models.study_material import StudyMaterial
from app.schemas.material import (
    MaterialResponse,
    MaterialDetailResponse,
    PasteTextRequest,
)
from app.services.material_service import (
    validate_upload,
    extract_text_from_pdf,
    extract_text_from_txt,
    extract_text_from_markdown,
    MAX_FILE_SIZE_BYTES,
)
from app.services.storage_service import get_storage_service

router = APIRouter()


@router.get("", response_model=list[MaterialResponse])
async def list_materials(
    course_id: UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all materials for the current user, optionally filtered by course."""
    stmt = select(StudyMaterial).where(StudyMaterial.user_id == current_user.id)

    if course_id is not None:
        stmt = stmt.where(StudyMaterial.course_id == course_id)

    stmt = stmt.order_by(StudyMaterial.created_at.desc())

    result = await db.execute(stmt)
    materials = result.scalars().all()

    return [MaterialResponse.model_validate(m) for m in materials]


@router.post("/upload", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_material(
    file: UploadFile = File(...),
    title: str | None = Form(None),
    course_id: UUID | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a file (PDF, TXT, or Markdown).
    Steps: validate → extract → store → insert DB.
    """
    # Use filename if title not provided
    if not title:
        title = file.filename or "Untitled Document"
    
    # Validate MIME type
    validate_upload(file)

    # Verify course ownership if provided
    if course_id is not None:
        course_result = await db.execute(
            select(Course).where(Course.id == course_id)
        )
        course = course_result.scalar_one_or_none()
        if course is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
            )
        if course.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to add materials to this course",
            )

    # Read file bytes
    file_bytes = await file.read()
    file_size = len(file_bytes)

    # Check file size
    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum of {MAX_FILE_SIZE_BYTES / (1024*1024)} MB",
        )

    # Extract text based on content type
    extraction_warning = False
    if file.content_type == "application/pdf":
        extracted_text, extraction_warning = extract_text_from_pdf(file_bytes)
        source_type = "pdf"
        extension = "pdf"
    elif file.content_type == "text/plain":
        extracted_text = extract_text_from_txt(file_bytes)
        source_type = "txt"
        extension = "txt"
    elif file.content_type == "text/markdown":
        extracted_text = extract_text_from_markdown(file_bytes)
        source_type = "markdown"
        extension = "md"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type",
        )

    # Store file
    storage_service = get_storage_service()
    storage_key = await storage_service.store(
        file_bytes=file_bytes,
        user_id=str(current_user.id),
        extension=extension,
    )

    # Create DB record
    material = StudyMaterial(
        user_id=current_user.id,
        course_id=course_id,
        title=title,
        source_type=source_type,
        original_filename=file.filename,
        storage_key=storage_key,
        extracted_text=extracted_text,
        file_size_bytes=file_size,
        extraction_warning=extraction_warning,
    )
    db.add(material)
    await db.commit()
    await db.refresh(material)

    return MaterialResponse.model_validate(material)


@router.post("/paste", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def paste_text_material(
    paste_data: PasteTextRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create material from pasted text.
    No file upload, extracted_text = content, storage_key = null.
    """
    # Verify course ownership if provided
    if paste_data.course_id is not None:
        course_result = await db.execute(
            select(Course).where(Course.id == paste_data.course_id)
        )
        course = course_result.scalar_one_or_none()
        if course is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
            )
        if course.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to add materials to this course",
            )

    # Create DB record
    material = StudyMaterial(
        user_id=current_user.id,
        course_id=paste_data.course_id,
        title=paste_data.title,
        source_type="pasted_text",
        original_filename=None,
        storage_key=None,
        extracted_text=paste_data.content,
        file_size_bytes=None,
        extraction_warning=False,
    )
    db.add(material)
    await db.commit()
    await db.refresh(material)

    return MaterialResponse.model_validate(material)


@router.get("/{material_id}", response_model=MaterialDetailResponse)
async def get_material(
    material_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single material by ID including extracted text."""
    result = await db.execute(
        select(StudyMaterial).where(StudyMaterial.id == material_id)
    )
    material = result.scalar_one_or_none()

    if material is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Material not found"
        )

    # Enforce ownership
    if material.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this material",
        )

    return MaterialDetailResponse.model_validate(material)


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material(
    material_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a material. Removes storage object + DB row."""
    result = await db.execute(
        select(StudyMaterial).where(StudyMaterial.id == material_id)
    )
    material = result.scalar_one_or_none()

    if material is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Material not found"
        )

    # Enforce ownership
    if material.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this material",
        )

    # Delete from storage if exists
    if material.storage_key:
        storage_service = get_storage_service()
        await storage_service.delete(material.storage_key)

    # Delete from DB
    await db.delete(material)
    await db.commit()

    return None
