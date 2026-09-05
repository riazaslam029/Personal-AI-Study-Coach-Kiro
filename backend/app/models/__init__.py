# Import all models here so Alembic can discover them via Base.metadata
from app.models.base import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.refresh_token import RefreshToken  # noqa: F401
from app.models.course import Course  # noqa: F401
from app.models.task import Task  # noqa: F401
from app.models.study_material import StudyMaterial  # noqa: F401
from app.models.study_plan import StudyPlanSession  # noqa: F401
from app.models.ai_prioritization import AIPrioritization  # noqa: F401
