"""Study plan generation service."""
from datetime import date, datetime, timedelta
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.study_plan import StudyPlanSession
from app.models.task import Task
from app.services.ai_service import AIService


async def generate_plan(
    db: AsyncSession,
    user_id: UUID,
    ai_service: AIService,
    available_hours_per_day: float,
    start_date: date,
    end_date: date,
) -> list[StudyPlanSession]:
    """
    Generate a new study plan for the user.
    
    Process:
    1. Fetch all not_started + in_progress tasks
    2. Fetch upcoming exam tasks within 21 days
    3. Call ai_service.generate_study_plan
    4. Transaction: DELETE existing sessions, bulk INSERT new sessions
    5. Return list of new sessions
    
    Args:
        db: Database session
        user_id: User UUID
        ai_service: AI service instance
        available_hours_per_day: Hours available per day
        start_date: Plan start date
        end_date: Plan end date (inclusive)
        
    Returns:
        List of newly created StudyPlanSession instances
        
    Raises:
        Exception: If AI service fails or database operation fails
    """
    # Fetch active tasks (not_started + in_progress)
    result = await db.execute(
        select(Task)
        .where(
            Task.user_id == user_id,
            Task.status.in_(["not_started", "in_progress"]),
        )
        .order_by(Task.deadline.asc().nulls_last())
    )
    active_tasks = result.scalars().all()
    
    # Fetch upcoming exam tasks within 21 days
    exam_deadline = date.today() + timedelta(days=21)
    result = await db.execute(
        select(Task)
        .where(
            Task.user_id == user_id,
            Task.task_type == "exam",
            Task.deadline.isnot(None),
            Task.deadline <= exam_deadline,
        )
        .order_by(Task.deadline.asc())
    )
    exam_tasks = result.scalars().all()
    
    # Combine and deduplicate tasks (exams might already be in active_tasks)
    task_ids_seen = set()
    all_tasks = []
    
    for task in list(active_tasks) + list(exam_tasks):
        if task.id not in task_ids_seen:
            task_ids_seen.add(task.id)
            all_tasks.append(task)
    
    # If no tasks, return empty plan
    if not all_tasks:
        # Still delete existing plan
        await db.execute(
            delete(StudyPlanSession).where(StudyPlanSession.user_id == user_id)
        )
        await db.commit()
        return []
    
    # Convert tasks to dict format for AI
    task_dicts = [
        {
            "id": str(task.id),
            "course_id": str(task.course_id) if task.course_id else None,
            "title": task.title,
            "description": task.description,
            "task_type": task.task_type,
            "priority": task.priority,
            "difficulty": task.difficulty,
            "estimated_hours": float(task.estimated_hours) if task.estimated_hours else None,
            "deadline": str(task.deadline) if task.deadline else None,
            "status": task.status,
        }
        for task in all_tasks
    ]
    
    # Call AI service to generate plan
    study_sessions = await ai_service.generate_study_plan(
        task_dicts,
        available_hours_per_day,
        start_date,
        end_date,
    )
    
    # Begin transaction: delete old plan, insert new plan
    await db.execute(
        delete(StudyPlanSession).where(StudyPlanSession.user_id == user_id)
    )
    
    # Create new sessions
    new_sessions = []
    generation_time = datetime.utcnow()
    
    for session in study_sessions:
        # Parse the session data
        session_date = date.fromisoformat(session.date)
        course_id = UUID(session.course_id) if session.course_id else None
        task_id = UUID(session.task_id) if session.task_id else None
        
        # Create database record
        db_session = StudyPlanSession(
            user_id=user_id,
            course_id=course_id,
            task_id=task_id,
            session_date=session_date,
            duration_minutes=session.duration_minutes,
            session_type=session.session_type,
            task_title=session.task_title,
            rationale=session.rationale,
            is_completed=False,
            generated_at=generation_time,
        )
        db.add(db_session)
        new_sessions.append(db_session)
    
    # Commit transaction
    await db.commit()
    
    # Refresh to get generated IDs
    for session in new_sessions:
        await db.refresh(session)
    
    return new_sessions
