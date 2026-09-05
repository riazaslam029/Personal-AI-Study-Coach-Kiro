"""Course CRUD endpoints."""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import date

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.course import Course
from app.models.task import Task
from app.models.study_material import StudyMaterial
from app.schemas.course import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseStatsResponse,
)

router = APIRouter()


@router.get("", response_model=list[CourseResponse])
async def list_courses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all courses for the current user with task/material counts."""
    # Query courses with joined counts
    stmt = (
        select(
            Course,
            func.count(Task.id).filter(Task.id.isnot(None)).label("task_count"),
            func.count(Task.id)
            .filter(Task.status == "completed")
            .label("completed_task_count"),
            func.count(StudyMaterial.id)
            .filter(StudyMaterial.id.isnot(None))
            .label("material_count"),
        )
        .where(Course.user_id == current_user.id)
        .outerjoin(Task, Course.id == Task.course_id)
        .outerjoin(StudyMaterial, Course.id == StudyMaterial.course_id)
        .group_by(Course.id)
        .order_by(Course.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    courses = []
    for row in rows:
        course_dict = {
            "id": row.Course.id,
            "name": row.Course.name,
            "description": row.Course.description,
            "color": row.Course.color,
            "created_at": row.Course.created_at,
            "updated_at": row.Course.updated_at,
            "task_count": row.task_count,
            "completed_task_count": row.completed_task_count,
            "material_count": row.material_count,
        }
        courses.append(CourseResponse(**course_dict))

    return courses


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new course."""
    course = Course(
        user_id=current_user.id,
        name=course_data.name,
        description=course_data.description,
        color=course_data.color,
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)

    # Return with zero counts
    course_dict = {
        "id": course.id,
        "name": course.name,
        "description": course.description,
        "color": course.color,
        "created_at": course.created_at,
        "updated_at": course.updated_at,
        "task_count": 0,
        "completed_task_count": 0,
        "material_count": 0,
    }
    return CourseResponse(**course_dict)


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single course by ID with counts."""
    # Query course with counts
    stmt = (
        select(
            Course,
            func.count(Task.id).filter(Task.id.isnot(None)).label("task_count"),
            func.count(Task.id)
            .filter(Task.status == "completed")
            .label("completed_task_count"),
            func.count(StudyMaterial.id)
            .filter(StudyMaterial.id.isnot(None))
            .label("material_count"),
        )
        .where(Course.id == course_id)
        .outerjoin(Task, Course.id == Task.course_id)
        .outerjoin(StudyMaterial, Course.id == StudyMaterial.course_id)
        .group_by(Course.id)
    )
    result = await db.execute(stmt)
    row = result.one_or_none()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )

    # Enforce ownership
    if row.Course.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this course",
        )

    course_dict = {
        "id": row.Course.id,
        "name": row.Course.name,
        "description": row.Course.description,
        "color": row.Course.color,
        "created_at": row.Course.created_at,
        "updated_at": row.Course.updated_at,
        "task_count": row.task_count,
        "completed_task_count": row.completed_task_count,
        "material_count": row.material_count,
    }
    return CourseResponse(**course_dict)


@router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: UUID,
    course_data: CourseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a course."""
    # Fetch course
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )

    # Enforce ownership
    if course.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this course",
        )

    # Update fields
    if course_data.name is not None:
        course.name = course_data.name
    if course_data.description is not None:
        course.description = course_data.description
    if course_data.color is not None:
        course.color = course_data.color

    await db.commit()
    await db.refresh(course)

    # Fetch counts
    stmt = (
        select(
            func.count(Task.id).filter(Task.id.isnot(None)).label("task_count"),
            func.count(Task.id)
            .filter(Task.status == "completed")
            .label("completed_task_count"),
            func.count(StudyMaterial.id)
            .filter(StudyMaterial.id.isnot(None))
            .label("material_count"),
        )
        .select_from(Course)
        .where(Course.id == course_id)
        .outerjoin(Task, Course.id == Task.course_id)
        .outerjoin(StudyMaterial, Course.id == StudyMaterial.course_id)
    )
    count_result = await db.execute(stmt)
    counts = count_result.one()

    course_dict = {
        "id": course.id,
        "name": course.name,
        "description": course.description,
        "color": course.color,
        "created_at": course.created_at,
        "updated_at": course.updated_at,
        "task_count": counts.task_count,
        "completed_task_count": counts.completed_task_count,
        "material_count": counts.material_count,
    }
    return CourseResponse(**course_dict)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a course. Tasks and materials are set to null course_id via SET NULL."""
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )

    # Enforce ownership
    if course.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this course",
        )

    await db.delete(course)
    await db.commit()
    return None


@router.get("/{course_id}/stats", response_model=CourseStatsResponse)
async def get_course_stats(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated stats for a course including overdue tasks."""
    # Verify course exists and belongs to user
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )

    if course.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this course",
        )

    # Fetch all tasks for the course
    tasks_result = await db.execute(
        select(Task).where(Task.course_id == course_id)
    )
    tasks = tasks_result.scalars().all()

    today = date.today()
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == "completed")
    pending_tasks = total_tasks - completed_tasks
    overdue_tasks = sum(
        1
        for t in tasks
        if t.status != "completed" and t.deadline and t.deadline < today
    )

    estimated_hours_total = sum(
        float(t.estimated_hours) for t in tasks if t.estimated_hours
    )
    estimated_hours_completed = sum(
        float(t.estimated_hours)
        for t in tasks
        if t.status == "completed" and t.estimated_hours
    )

    return CourseStatsResponse(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        pending_tasks=pending_tasks,
        overdue_tasks=overdue_tasks,
        estimated_hours_total=estimated_hours_total,
        estimated_hours_completed=estimated_hours_completed,
    )
