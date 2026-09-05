from fastapi import APIRouter
from app.api import auth, courses, tasks, materials, ai, plan

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(materials.router, prefix="/materials", tags=["materials"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(plan.router, prefix="/plan", tags=["plan"])
