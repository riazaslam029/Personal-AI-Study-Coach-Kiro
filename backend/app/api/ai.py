"""AI assistant and task prioritization routes."""
import asyncio
import logging
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_ai_service, get_current_user
from app.models.ai_prioritization import AIPrioritization
from app.models.study_material import StudyMaterial
from app.models.task import Task
from app.models.user import User
from app.schemas.ai import (
    ChatRequest,
    ChatResponse,
    KeyPointsRequest,
    KeyPointsResponse,
    PrioritizationResponse,
    QuizRequest,
    QuizResponse,
    SummarizeRequest,
    SummarizeResponse,
)
from app.services.ai_service import AIService

router = APIRouter()
logger = logging.getLogger(__name__)

# Constants
MAX_MATERIALS_PER_QUERY = 3
MAX_CHARS_PER_MATERIAL = 50_000
MAX_HISTORY_TURNS = 10


async def handle_ai_error(e: Exception, feature: str) -> HTTPException:
    """
    Centralized AI error handler.
    
    Returns HTTP 503 with consistent error code for all AI failures.
    """
    if isinstance(e, asyncio.TimeoutError):
        logger.warning(f"AI timeout [{feature}]")
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service timed out. Please try again.",
            headers={"code": "AI_UNAVAILABLE"},
        )
    elif isinstance(e, ValueError):
        logger.warning(f"AI parsing error [{feature}]: {e}")
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI returned an unexpected response. Please try again.",
            headers={"code": "AI_UNAVAILABLE"},
        )
    else:
        logger.error(f"AI error [{feature}]: {type(e).__name__}: {e}")
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is temporarily unavailable.",
            headers={"code": "AI_UNAVAILABLE"},
        )


async def fetch_material_text(
    db: AsyncSession,
    material_id: UUID,
    user_id: UUID,
) -> str:
    """
    Fetch and validate study material text.
    
    Args:
        db: Database session
        material_id: Material UUID
        user_id: Owner user UUID
        
    Returns:
        Extracted text (truncated to MAX_CHARS_PER_MATERIAL)
        
    Raises:
        HTTPException: If material not found or access denied
    """
    result = await db.execute(
        select(StudyMaterial).where(
            StudyMaterial.id == material_id,
            StudyMaterial.user_id == user_id,
        )
    )
    material = result.scalar_one_or_none()
    
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study material {material_id} not found.",
        )
    
    # Truncate to max chars
    text = material.extracted_text or ""
    return text[:MAX_CHARS_PER_MATERIAL]


@router.post("/assistant/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ai_service: AIService = Depends(get_ai_service),
):
    """
    Ask a question with study material as context.
    
    - Supports up to 3 study materials as context
    - Each material truncated to 50k chars
    - History capped at last 10 turns
    """
    # Validate material count
    if len(request.material_ids) > MAX_MATERIALS_PER_QUERY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_MATERIALS_PER_QUERY} materials allowed per query.",
        )
    
    try:
        # Fetch materials
        material_contexts = []
        for material_id in request.material_ids:
            text = await fetch_material_text(db, material_id, current_user.id)
            material_contexts.append(text)
        
        # Truncate history
        history = request.history[-MAX_HISTORY_TURNS:] if request.history else []
        
        # Call AI service
        answer, grounded = await ai_service.answer_question(
            material_contexts,
            request.question,
            history,
        )
        
        return ChatResponse(
            answer=answer,
            grounded_in_material=grounded,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise await handle_ai_error(e, "chat")


@router.post("/assistant/summarize", response_model=SummarizeResponse)
async def summarize_material(
    request: SummarizeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ai_service: AIService = Depends(get_ai_service),
):
    """Generate a summary of study material."""
    try:
        # Fetch material
        text = await fetch_material_text(db, request.material_id, current_user.id)
        
        # Call AI service
        summary = await ai_service.summarize(text)
        
        return SummarizeResponse(summary=summary)
        
    except HTTPException:
        raise
    except Exception as e:
        raise await handle_ai_error(e, "summarize")


@router.post("/assistant/key-points", response_model=KeyPointsResponse)
async def extract_key_points(
    request: KeyPointsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ai_service: AIService = Depends(get_ai_service),
):
    """Extract key points from study material."""
    try:
        # Fetch material
        text = await fetch_material_text(db, request.material_id, current_user.id)
        
        # Call AI service
        key_points = await ai_service.extract_key_points(text)
        
        return KeyPointsResponse(key_points=key_points)
        
    except HTTPException:
        raise
    except Exception as e:
        raise await handle_ai_error(e, "key-points")


@router.post("/assistant/quiz", response_model=QuizResponse)
async def generate_quiz(
    request: QuizRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ai_service: AIService = Depends(get_ai_service),
):
    """Generate quiz questions from study material."""
    try:
        # Fetch material
        text = await fetch_material_text(db, request.material_id, current_user.id)
        
        # Call AI service
        questions = await ai_service.generate_quiz(text)
        
        return QuizResponse(questions=questions)
        
    except HTTPException:
        raise
    except Exception as e:
        raise await handle_ai_error(e, "quiz")


@router.post("/prioritize", response_model=PrioritizationResponse)
async def prioritize_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ai_service: AIService = Depends(get_ai_service),
):
    """
    Generate AI task prioritization.
    
    - Fetches all pending and in_progress tasks
    - Calls AI to rank by priority
    - Stores result in ai_prioritizations table (replaces old result)
    """
    try:
        # Fetch all active tasks
        result = await db.execute(
            select(Task)
            .where(
                Task.user_id == current_user.id,
                Task.status.in_(["not_started", "in_progress"]),
            )
            .order_by(Task.deadline.asc().nulls_last())
        )
        tasks = result.scalars().all()
        
        if not tasks:
            return PrioritizationResponse(
                generated_at=datetime.utcnow(),
                prioritized_tasks=[],
            )
        
        # Convert to dict format for AI
        task_dicts = [
            {
                "id": str(task.id),
                "title": task.title,
                "description": task.description,
                "task_type": task.task_type,
                "priority": task.priority,
                "difficulty": task.difficulty,
                "estimated_hours": float(task.estimated_hours) if task.estimated_hours else None,
                "deadline": str(task.deadline) if task.deadline else None,
                "status": task.status,
            }
            for task in tasks
        ]
        
        # Call AI service
        prioritized = await ai_service.prioritize_tasks(task_dicts)
        
        # Store in database (delete old, insert new)
        await db.execute(
            delete(AIPrioritization).where(
                AIPrioritization.user_id == current_user.id
            )
        )
        
        results_json = [
            {
                "task_id": str(p.task_id),
                "task_title": p.task_title,
                "priority_rank": p.priority_rank,
                "explanation": p.explanation,
            }
            for p in prioritized
        ]
        
        new_prioritization = AIPrioritization(
            user_id=current_user.id,
            results=results_json,
            generated_at=datetime.utcnow(),
        )
        db.add(new_prioritization)
        await db.commit()
        
        return PrioritizationResponse(
            generated_at=new_prioritization.generated_at,
            prioritized_tasks=prioritized,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise await handle_ai_error(e, "prioritize")


@router.get("/prioritize/latest", response_model=PrioritizationResponse | None)
async def get_latest_prioritization(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the latest AI task prioritization result.
    
    Returns null if no prioritization has been generated yet.
    """
    result = await db.execute(
        select(AIPrioritization)
        .where(AIPrioritization.user_id == current_user.id)
        .order_by(AIPrioritization.generated_at.desc())
        .limit(1)
    )
    prioritization = result.scalar_one_or_none()
    
    if not prioritization:
        return None
    
    # Convert JSONB results to Pydantic models
    from app.schemas.ai import PrioritizedTask
    
    prioritized_tasks = [
        PrioritizedTask(**item) for item in prioritization.results
    ]
    
    return PrioritizationResponse(
        generated_at=prioritization.generated_at,
        prioritized_tasks=prioritized_tasks,
    )
