"""Study plan generation and management routes."""
import asyncio
import logging
from collections import defaultdict
from datetime import date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_ai_service, get_current_user
from app.models.course import Course
from app.models.study_plan import StudyPlanSession
from app.models.user import User
from app.schemas.plan import (
    GeneratePlanRequest,
    PlanByDateResponse,
    PlanResponse,
    PlanSessionResponse,
)
from app.services.ai_service import AIService
from app.services.plan_service import generate_plan

router = APIRouter()
logger = logging.getLogger(__name__)


async def handle_plan_ai_error(e: Exception) -> HTTPException:
    """Handle AI errors for plan generation."""
    if isinstance(e, asyncio.TimeoutError):
        logger.warning("AI timeout during plan generation")
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service timed out while generating plan. Please try again.",
            headers={"code": "AI_UNAVAILABLE"},
        )
    elif isinstance(e, ValueError):
        logger.warning(f"AI parsing error during plan generation: {e}")
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI returned an unexpected response. Please try again.",
            headers={"code": "AI_UNAVAILABLE"},
        )
    else:
        logger.error(f"Plan generation error: {type(e).__name__}: {e}")
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is temporarily unavailable.",
            headers={"code": "AI_UNAVAILABLE"},
        )


def session_to_response(session: StudyPlanSession) -> PlanSessionResponse:
    """Convert database session to response model."""
    return PlanSessionResponse(
        id=session.id,
        session_date=session.session_date,
        course_id=session.course_id,
        course_name=session.course.name if session.course else None,
        course_color=session.course.color if session.course else None,
        task_id=session.task_id,
        task_title=session.task_title,
        duration_minutes=session.duration_minutes,
        session_type=session.session_type,
        rationale=session.rationale,
        is_completed=session.is_completed,
        generated_at=session.generated_at,
    )


@router.post("/generate", response_model=PlanResponse)
async def generate_study_plan(
    request: GeneratePlanRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ai_service: AIService = Depends(get_ai_service),
):
    """
    Generate (or regenerate) a study plan.
    
    - Fetches all pending/in-progress tasks + upcoming exams
    - Calls AI to generate structured schedule
    - Replaces existing plan with new plan
    - Returns all sessions
    """
    # Validate date range
    if request.start_date > request.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be before or equal to end_date",
        )
    
    # Convert per-day hours to average if dict provided
    if isinstance(request.available_hours_per_day, dict):
        # Calculate average hours per day
        hours_values = list(request.available_hours_per_day.values())
        avg_hours = sum(hours_values) / len(hours_values) if hours_values else 3.0
    else:
        avg_hours = request.available_hours_per_day
    
    try:
        # Generate plan
        sessions = await generate_plan(
            db,
            current_user.id,
            ai_service,
            avg_hours,
            request.start_date,
            request.end_date,
        )
        
        # Load course relationships for response
        session_ids = [s.id for s in sessions]
        result = await db.execute(
            select(StudyPlanSession)
            .where(StudyPlanSession.id.in_(session_ids))
            .options(selectinload(StudyPlanSession.course))
        )
        sessions_with_courses = result.scalars().all()
        
        # Convert to response models
        session_responses = [
            session_to_response(s) for s in sessions_with_courses
        ]
        
        # Get generation time (all sessions have same generated_at)
        generated_at = sessions[0].generated_at if sessions else datetime.utcnow()
        
        return PlanResponse(
            generated_at=generated_at,
            session_count=len(session_responses),
            sessions=session_responses,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise await handle_plan_ai_error(e)


@router.get("/", response_model=PlanByDateResponse)
async def get_study_plan(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current active study plan sessions grouped by date.
    
    Returns all sessions for the current plan, organized by date.
    """
    # Fetch all sessions for user
    result = await db.execute(
        select(StudyPlanSession)
        .where(StudyPlanSession.user_id == current_user.id)
        .options(selectinload(StudyPlanSession.course))
        .order_by(StudyPlanSession.session_date.asc())
    )
    sessions = result.scalars().all()
    
    if not sessions:
        return PlanByDateResponse(
            generated_at=datetime.utcnow(),
            sessions_by_date={},
        )
    
    # Group by date
    sessions_by_date = defaultdict(list)
    for session in sessions:
        date_key = session.session_date.isoformat()
        sessions_by_date[date_key].append(session_to_response(session))
    
    # Get generation time from first session
    generated_at = sessions[0].generated_at
    
    return PlanByDateResponse(
        generated_at=generated_at,
        sessions_by_date=dict(sessions_by_date),
    )


@router.get("/today", response_model=list[PlanSessionResponse])
async def get_todays_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get today's study plan sessions only.
    
    Returns sessions scheduled for today.
    """
    today = date.today()
    
    result = await db.execute(
        select(StudyPlanSession)
        .where(
            StudyPlanSession.user_id == current_user.id,
            StudyPlanSession.session_date == today,
        )
        .options(selectinload(StudyPlanSession.course))
        .order_by(StudyPlanSession.duration_minutes.desc())
    )
    sessions = result.scalars().all()
    
    return [session_to_response(s) for s in sessions]


@router.patch("/sessions/{session_id}/complete", response_model=PlanSessionResponse)
async def complete_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a study session as completed.
    
    Sets is_completed to true for the specified session.
    """
    # Fetch session
    result = await db.execute(
        select(StudyPlanSession)
        .where(
            StudyPlanSession.id == session_id,
            StudyPlanSession.user_id == current_user.id,
        )
        .options(selectinload(StudyPlanSession.course))
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )
    
    # Update completion status
    session.is_completed = True
    await db.commit()
    await db.refresh(session)
    
    return session_to_response(session)
