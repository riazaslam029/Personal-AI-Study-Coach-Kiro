"""Task CRUD endpoints."""
from uuid import UUID
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.course import Course
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter()


def _task_to_response(
    task: Task,
    course_name: str | None,
    course_color: str | None,
) -> TaskResponse:
    """Convert Task model to TaskResponse with computed fields."""
    today = date.today()
    is_overdue = (
        task.status != "completed"
        and task.deadline is not None
        and task.deadline < today
    )
    return TaskResponse(
        id=task.id,
        course_id=task.course_id,
        course_name=course_name,
        course_color=course_color,
        title=task.title,
        description=task.description,
        task_type=task.task_type,
        status=task.status,
        priority=task.priority,
        difficulty=task.difficulty,
        estimated_hours=float(task.estimated_hours) if task.estimated_hours else None,
        deadline=task.deadline,
        completed_at=task.completed_at,
        is_overdue=is_overdue,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


async def _load_course_owned(
    db: AsyncSession, course_id: UUID, user_id: UUID
) -> Course:
    """Fetch a course and ensure the current user owns it. Raises 404/403."""
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )
    if course.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to use this course",
        )
    return course


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    course_id: UUID | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    task_type: str | None = Query(None),
    priority: str | None = Query(None),
    deadline_from: date | None = Query(None),
    deadline_to: date | None = Query(None),
    sort_by: str = Query("created_at", regex="^(created_at|deadline|priority|title)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List tasks with optional filters and sorting. Course is eager-loaded."""
    stmt = (
        select(Task)
        .options(selectinload(Task.course))
        .where(Task.user_id == current_user.id)
    )
    if course_id is not None:
        stmt = stmt.where(Task.course_id == course_id)
    if status_filter is not None:
        stmt = stmt.where(Task.status == status_filter)
    if task_type is not None:
        stmt = stmt.where(Task.task_type == task_type)
    if priority is not None:
        stmt = stmt.where(Task.priority == priority)
    if deadline_from is not None:
        stmt = stmt.where(Task.deadline >= deadline_from)
    if deadline_to is not None:
        stmt = stmt.where(Task.deadline <= deadline_to)

    order_col = getattr(Task, sort_by)
    stmt = stmt.order_by(order_col.asc() if sort_order == "asc" else order_col.desc())

    result = await db.execute(stmt)
    tasks = result.scalars().all()

    return [
        _task_to_response(
            task,
            task.course.name if task.course else None,
            task.course.color if task.course else None,
        )
        for task in tasks
    ]


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new task."""
    # Verify course ownership if course_id provided (course object also feeds the response).
    course: Course | None = None
    if task_data.course_id is not None:
        course = await _load_course_owned(db, task_data.course_id, current_user.id)

    task = Task(
        user_id=current_user.id,
        course_id=task_data.course_id,
        title=task_data.title,
        description=task_data.description,
        task_type=task_data.task_type,
        priority=task_data.priority,
        difficulty=task_data.difficulty,
        estimated_hours=task_data.estimated_hours,
        deadline=task_data.deadline,
    )
    db.add(task)
    await db.commit()
    # Populate server-side defaults (id, timestamps, status/priority) into the
    # Python object. This refreshes scalar columns only — no relationships,
    # so no MissingGreenlet risk in async mode.
    await db.refresh(task)

    return _task_to_response(
        task,
        course.name if course else None,
        course.color if course else None,
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single task by ID."""
    result = await db.execute(
        select(Task).options(selectinload(Task.course)).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this task",
        )

    return _task_to_response(
        task,
        task.course.name if task.course else None,
        task.course.color if task.course else None,
    )


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a task. If status changes to 'completed', set completed_at."""
    # Task loaded with course eager-loaded so we can access task.course without
    # any lazy IO (that would raise MissingGreenlet in async mode).
    result = await db.execute(
        select(Task).options(selectinload(Task.course)).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this task",
        )

    # If the caller is reassigning the task to a different course, verify
    # ownership of the new course and remember it for the response.
    new_course: Course | None = None
    if (
        task_data.course_id is not None
        and task_data.course_id != task.course_id
    ):
        new_course = await _load_course_owned(
            db, task_data.course_id, current_user.id
        )

    old_status = task.status

    if task_data.course_id is not None:
        task.course_id = task_data.course_id
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.task_type is not None:
        task.task_type = task_data.task_type
    if task_data.status is not None:
        task.status = task_data.status
    if task_data.priority is not None:
        task.priority = task_data.priority
    if task_data.difficulty is not None:
        task.difficulty = task_data.difficulty
    if task_data.estimated_hours is not None:
        task.estimated_hours = task_data.estimated_hours
    if task_data.deadline is not None:
        task.deadline = task_data.deadline

    if old_status != "completed" and task.status == "completed":
        task.completed_at = datetime.now(timezone.utc)

    # Snapshot course details BEFORE commit — after refresh, the loaded
    # relationship may or may not remain populated depending on SA internals.
    if new_course is not None:
        course_name = new_course.name
        course_color = new_course.color
    elif task.course is not None:
        course_name = task.course.name
        course_color = task.course.color
    else:
        course_name = None
        course_color = None

    await db.commit()
    # Refresh scalar columns to pick up server-side updated_at. No attribute
    # list so relationships are not touched.
    await db.refresh(task)

    return _task_to_response(task, course_name, course_color)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a task."""
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this task",
        )

    await db.delete(task)
    await db.commit()
    return None


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a task as completed. Sets status='completed' and completed_at=now()."""
    result = await db.execute(
        select(Task).options(selectinload(Task.course)).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to complete this task",
        )

    task.status = "completed"
    task.completed_at = datetime.now(timezone.utc)

    # Snapshot course details from the eager-loaded relationship before commit.
    course_name = task.course.name if task.course else None
    course_color = task.course.color if task.course else None

    await db.commit()
    await db.refresh(task)

    return _task_to_response(task, course_name, course_color)
