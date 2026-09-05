"""AI service layer: abstract base class and Gemini implementation."""
import asyncio
import json
import re
from abc import ABC, abstractmethod
from datetime import date
from typing import Any

import google.generativeai as genai

from app.core.config import settings
from app.schemas.ai import (
    KeyPoint,
    PrioritizedTask,
    QuizQuestion,
    StudySession,
)

# Type alias for chat messages
type ChatMessage = dict[str, str]  # {"role": "user"|"assistant", "content": str}

# System prompt for the Gemini model
STUDY_COACH_SYSTEM_PROMPT = """You are a personal academic study coach helping a university student.
Your role is to help students understand their study material, plan their study time effectively, and prioritize their academic tasks intelligently.

When answering questions about study material:
- Ground your answer in the provided document excerpts
- Clearly indicate if you are drawing on general knowledge not in the material
- Be concise, clear, and encouraging

For structured outputs (study plans, prioritizations, quizzes, key points):
- Always return valid JSON matching the requested schema exactly
- Do not include explanation text outside the JSON structure
- Focus on practical, actionable guidance"""


class AIService(ABC):
    """Abstract base class for AI service implementations."""

    @abstractmethod
    async def answer_question(
        self,
        material_context: list[str],
        question: str,
        history: list[ChatMessage],
    ) -> tuple[str, bool]:
        """
        Answer a question using study material as context.
        
        Args:
            material_context: List of extracted text from study materials
            question: User's question
            history: Previous conversation turns
            
        Returns:
            Tuple of (answer_text, grounded_in_material)
        """
        pass

    @abstractmethod
    async def summarize(self, material_context: str) -> str:
        """Generate a summary of study material."""
        pass

    @abstractmethod
    async def extract_key_points(self, material_context: str) -> list[KeyPoint]:
        """Extract key points from study material."""
        pass

    @abstractmethod
    async def generate_quiz(self, material_context: str) -> list[QuizQuestion]:
        """Generate quiz questions from study material."""
        pass

    @abstractmethod
    async def generate_study_plan(
        self,
        tasks: list[dict],
        available_hours_per_day: float,
        start_date: date,
        end_date: date,
    ) -> list[StudySession]:
        """Generate a study plan based on tasks and constraints."""
        pass

    @abstractmethod
    async def prioritize_tasks(self, tasks: list[dict]) -> list[PrioritizedTask]:
        """Prioritize tasks using AI analysis."""
        pass


def extract_json_from_response(raw: str) -> Any:
    """
    Extract and parse JSON from AI response.
    
    Looks for the first '[' or '{' character, extracts to the matching
    close bracket, and attempts json.loads.
    
    Args:
        raw: Raw text response from AI
        
    Returns:
        Parsed JSON data
        
    Raises:
        ValueError: If JSON parsing fails
    """
    # Strip markdown code fences if present
    cleaned = re.sub(r"```(?:json)?\s*", "", raw)
    cleaned = cleaned.strip()
    
    # Find first JSON structure
    start_idx = -1
    start_char = None
    
    for i, char in enumerate(cleaned):
        if char in "[{":
            start_idx = i
            start_char = char
            break
    
    if start_idx == -1:
        raise ValueError("No JSON structure found in response")
    
    # Find matching closing bracket
    end_char = "]" if start_char == "[" else "}"
    depth = 0
    end_idx = -1
    
    for i in range(start_idx, len(cleaned)):
        if cleaned[i] == start_char:
            depth += 1
        elif cleaned[i] == end_char:
            depth -= 1
            if depth == 0:
                end_idx = i + 1
                break
    
    if end_idx == -1:
        raise ValueError("No matching closing bracket found")
    
    json_str = cleaned[start_idx:end_idx]
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON: {e}")


def build_chat_prompt(
    material_contexts: list[str],
    question: str,
    history: list[ChatMessage],
) -> str:
    """Build prompt for chat/question answering."""
    prompt_parts = []
    
    # Add material context
    if material_contexts:
        prompt_parts.append("=== STUDY MATERIAL ===")
        for i, context in enumerate(material_contexts, 1):
            prompt_parts.append(f"\n--- Document {i} ---\n{context}")
        prompt_parts.append("\n=== END STUDY MATERIAL ===\n")
    
    # Add conversation history
    if history:
        prompt_parts.append("\n=== CONVERSATION HISTORY ===")
        for msg in history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            prompt_parts.append(f"{role.upper()}: {content}")
        prompt_parts.append("=== END HISTORY ===\n")
    
    # Add current question
    prompt_parts.append(f"\nSTUDENT QUESTION: {question}\n")
    
    if material_contexts:
        prompt_parts.append(
            "\nPlease answer the question based on the study material provided. "
            "If you need to use general knowledge not in the material, clearly state that."
        )
    else:
        prompt_parts.append(
            "\nPlease answer the question. Note: No study material was provided for context."
        )
    
    return "\n".join(prompt_parts)


def build_summary_prompt(material_context: str) -> str:
    """Build prompt for summarization."""
    return f"""Please provide a clear, concise summary of the following study material.
Focus on the main concepts, key definitions, and important points a student should remember.

=== STUDY MATERIAL ===
{material_context}
=== END STUDY MATERIAL ===

Provide the summary in 2-4 paragraphs."""


def build_key_points_prompt(material_context: str) -> str:
    """Build prompt for key points extraction."""
    return f"""Extract the key points from the following study material.
For each point, indicate its importance level (high, medium, or low).

=== STUDY MATERIAL ===
{material_context}
=== END STUDY MATERIAL ===

Return ONLY a JSON array with this exact structure:
[{{
  "point": "description of the key point",
  "importance": "high|medium|low"
}}]

Include 5-10 key points."""


def build_quiz_prompt(material_context: str) -> str:
    """Build prompt for quiz generation."""
    return f"""Generate 5 multiple-choice quiz questions based on the following study material.
Each question should have 4 options with one correct answer and an explanation.

=== STUDY MATERIAL ===
{material_context}
=== END STUDY MATERIAL ===

Return ONLY a JSON array with this exact structure:
[{{
  "question": "the question text",
  "options": ["option1", "option2", "option3", "option4"],
  "correct_answer": "the correct option text (must match one of the options exactly)",
  "explanation": "why this is the correct answer"
}}]"""


def build_plan_prompt(
    tasks: list[dict],
    available_hours_per_day: float,
    start_date: date,
    end_date: date,
) -> str:
    """Build prompt for study plan generation."""
    tasks_json = json.dumps(tasks, indent=2, default=str)
    
    return f"""Generate a study plan for the following student.

Available study hours per day: {available_hours_per_day}
Planning period: {start_date} to {end_date}

Pending tasks (JSON):
{tasks_json}

Rules:
1. Do not schedule more than {available_hours_per_day} hours per day
2. Prioritize by deadline proximity, then difficulty, then priority label
3. For tasks with task_type="exam", add a revision session 1-2 days before the exam deadline
4. Break tasks larger than 2 hours into multiple sessions across different days
5. Include a brief rationale for each session explaining why it's scheduled on that day
6. Use realistic session durations: 30-120 minutes per session
7. Tasks without deadlines should be scheduled after deadline-driven tasks

Return ONLY a JSON array with this exact structure:
[{{
  "date": "YYYY-MM-DD",
  "course_id": "uuid or null",
  "task_id": "uuid or null",
  "task_title": "string",
  "duration_minutes": integer,
  "session_type": "study|revision|exam_prep|assignment",
  "rationale": "string"
}}]

The date must be within the planning period. Each session should have a clear purpose."""


def build_prioritization_prompt(tasks: list[dict]) -> str:
    """Build prompt for task prioritization."""
    tasks_json = json.dumps(tasks, indent=2, default=str)
    
    return f"""Analyze and prioritize the following tasks for a university student.
Consider deadlines, difficulty, estimated hours, and current priority level.

Tasks (JSON):
{tasks_json}

Return ONLY a JSON array with tasks ranked by priority, this exact structure:
[{{
  "task_id": "uuid",
  "task_title": "string",
  "priority_rank": integer (1 = highest priority),
  "explanation": "brief explanation why this task has this priority rank"
}}]

Focus on urgent deadlines and high-difficulty tasks. Be practical and encouraging."""


class GeminiAIService(AIService):
    """Gemini AI service implementation using google-generativeai SDK."""

    def __init__(self):
        """Initialize Gemini AI service."""
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured")
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self._model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=STUDY_COACH_SYSTEM_PROMPT,
        )

    async def _generate(self, prompt: str, timeout: float = 60.0) -> str:
        """
        Wrap synchronous Gemini SDK call in thread executor.
        
        Args:
            prompt: The prompt text
            timeout: Timeout in seconds
            
        Returns:
            Generated text response
            
        Raises:
            asyncio.TimeoutError: If generation times out
        """
        loop = asyncio.get_event_loop()
        
        try:
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: self._model.generate_content(prompt)
                ),
                timeout=timeout,
            )
            return response.text
        except asyncio.TimeoutError:
            raise
        except Exception as e:
            # Log the original error but raise a clean exception
            raise RuntimeError(f"AI generation failed: {type(e).__name__}") from e

    async def answer_question(
        self,
        material_context: list[str],
        question: str,
        history: list[ChatMessage],
    ) -> tuple[str, bool]:
        """Answer a question using study material as context."""
        prompt = build_chat_prompt(material_context, question, history)
        answer = await self._generate(prompt)
        
        # Check if answer references material-specific content
        # Simple heuristic: if material was provided and answer is substantial,
        # assume it's grounded unless it explicitly says otherwise
        grounded = bool(material_context) and len(answer) > 50
        if "I don't have" in answer or "not in the material" in answer.lower():
            grounded = False
        
        return answer.strip(), grounded

    async def summarize(self, material_context: str) -> str:
        """Generate a summary of study material."""
        prompt = build_summary_prompt(material_context)
        summary = await self._generate(prompt)
        return summary.strip()

    async def extract_key_points(self, material_context: str) -> list[KeyPoint]:
        """Extract key points from study material."""
        prompt = build_key_points_prompt(material_context)
        raw = await self._generate(prompt)
        data = extract_json_from_response(raw)
        
        # Validate and convert to Pydantic models
        return [KeyPoint(**item) for item in data]

    async def generate_quiz(self, material_context: str) -> list[QuizQuestion]:
        """Generate quiz questions from study material."""
        prompt = build_quiz_prompt(material_context)
        raw = await self._generate(prompt)
        data = extract_json_from_response(raw)
        
        # Validate and convert to Pydantic models
        return [QuizQuestion(**item) for item in data]

    async def generate_study_plan(
        self,
        tasks: list[dict],
        available_hours_per_day: float,
        start_date: date,
        end_date: date,
    ) -> list[StudySession]:
        """Generate a study plan based on tasks and constraints."""
        prompt = build_plan_prompt(tasks, available_hours_per_day, start_date, end_date)
        raw = await self._generate(prompt, timeout=90.0)  # Longer timeout for planning
        data = extract_json_from_response(raw)
        
        # Validate and convert to Pydantic models
        return [StudySession(**item) for item in data]

    async def prioritize_tasks(self, tasks: list[dict]) -> list[PrioritizedTask]:
        """Prioritize tasks using AI analysis."""
        prompt = build_prioritization_prompt(tasks)
        raw = await self._generate(prompt)
        data = extract_json_from_response(raw)
        
        # Validate and convert to Pydantic models
        return [PrioritizedTask(**item) for item in data]


class OpenRouterAIService(AIService):
    """OpenRouter AI service implementation using httpx."""

    def __init__(self):
        """Initialize OpenRouter AI service."""
        if not settings.OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY not configured")
        
        import httpx
        self._client = httpx.AsyncClient(
            base_url="https://openrouter.ai/api/v1",
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "HTTP-Referer": settings.OPENROUTER_SITE_URL,
                "X-Title": settings.OPENROUTER_APP_NAME,
            },
            timeout=60.0,
        )

    async def _generate(self, prompt: str, timeout: float = 60.0) -> str:
        """
        Call OpenRouter API for text generation.
        
        Args:
            prompt: The prompt text
            timeout: Timeout in seconds
            
        Returns:
            Generated text response
            
        Raises:
            RuntimeError: If generation fails
        """
        try:
            response = await self._client.post(
                "/chat/completions",
                json={
                    "model": settings.OPENROUTER_MODEL,
                    "messages": [
                        {"role": "system", "content": STUDY_COACH_SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                },
                timeout=timeout,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            raise RuntimeError(f"OpenRouter generation failed: {type(e).__name__}") from e

    async def answer_question(
        self,
        material_context: list[str],
        question: str,
        history: list[ChatMessage],
    ) -> tuple[str, bool]:
        """Answer a question using study material as context."""
        prompt = build_chat_prompt(material_context, question, history)
        answer = await self._generate(prompt)
        
        grounded = bool(material_context) and len(answer) > 50
        if "I don't have" in answer or "not in the material" in answer.lower():
            grounded = False
        
        return answer.strip(), grounded

    async def summarize(self, material_context: str) -> str:
        """Generate a summary of study material."""
        prompt = build_summary_prompt(material_context)
        summary = await self._generate(prompt)
        return summary.strip()

    async def extract_key_points(self, material_context: str) -> list[KeyPoint]:
        """Extract key points from study material."""
        prompt = build_key_points_prompt(material_context)
        raw = await self._generate(prompt)
        data = extract_json_from_response(raw)
        return [KeyPoint(**item) for item in data]

    async def generate_quiz(self, material_context: str) -> list[QuizQuestion]:
        """Generate quiz questions from study material."""
        prompt = build_quiz_prompt(material_context)
        raw = await self._generate(prompt)
        data = extract_json_from_response(raw)
        return [QuizQuestion(**item) for item in data]

    async def generate_study_plan(
        self,
        tasks: list[dict],
        available_hours_per_day: float,
        start_date: date,
        end_date: date,
    ) -> list[StudySession]:
        """Generate a study plan based on tasks and constraints."""
        prompt = build_plan_prompt(tasks, available_hours_per_day, start_date, end_date)
        raw = await self._generate(prompt, timeout=90.0)
        data = extract_json_from_response(raw)
        return [StudySession(**item) for item in data]

    async def prioritize_tasks(self, tasks: list[dict]) -> list[PrioritizedTask]:
        """Prioritize tasks using AI analysis."""
        prompt = build_prioritization_prompt(tasks)
        raw = await self._generate(prompt)
        data = extract_json_from_response(raw)
        return [PrioritizedTask(**item) for item in data]


class FallbackAIService(AIService):
    """AI service with automatic fallback from Gemini to OpenRouter."""

    def __init__(self):
        """Initialize with both Gemini and OpenRouter services."""
        import logging
        self._logger = logging.getLogger(__name__)
        
        # Try to initialize both services
        self._gemini = None
        self._openrouter = None
        
        try:
            self._gemini = GeminiAIService()
            self._logger.info("✅ Gemini AI service initialized (primary)")
        except Exception as e:
            self._logger.warning(f"⚠️ Gemini initialization failed: {e}")
        
        try:
            self._openrouter = OpenRouterAIService()
            self._logger.info("✅ OpenRouter AI service initialized (fallback)")
        except Exception as e:
            self._logger.warning(f"⚠️ OpenRouter initialization failed: {e}")
        
        if not self._gemini and not self._openrouter:
            raise ValueError("No AI service available - both Gemini and OpenRouter failed to initialize")

    async def _generate_with_fallback(self, method_name: str, *args, **kwargs):
        """
        Try to call a method on Gemini, fallback to OpenRouter on failure.
        
        Args:
            method_name: Name of the method to call
            *args, **kwargs: Arguments to pass to the method
            
        Returns:
            Result from either Gemini or OpenRouter
        """
        # Try Gemini first
        if self._gemini:
            try:
                method = getattr(self._gemini, method_name)
                result = await method(*args, **kwargs)
                self._logger.debug(f"✅ {method_name} succeeded via Gemini")
                return result
            except Exception as e:
                self._logger.warning(f"⚠️ Gemini {method_name} failed: {e}, falling back to OpenRouter")
        
        # Fallback to OpenRouter
        if self._openrouter:
            try:
                method = getattr(self._openrouter, method_name)
                result = await method(*args, **kwargs)
                self._logger.info(f"✅ {method_name} succeeded via OpenRouter (fallback)")
                return result
            except Exception as e:
                self._logger.error(f"❌ OpenRouter {method_name} also failed: {e}")
                raise RuntimeError(f"Both AI providers failed for {method_name}") from e
        
        raise RuntimeError("No AI service available")

    async def answer_question(
        self,
        material_context: list[str],
        question: str,
        history: list[ChatMessage],
    ) -> tuple[str, bool]:
        """Answer a question with automatic fallback."""
        return await self._generate_with_fallback(
            "answer_question", material_context, question, history
        )

    async def summarize(self, material_context: str) -> str:
        """Summarize with automatic fallback."""
        return await self._generate_with_fallback("summarize", material_context)

    async def extract_key_points(self, material_context: str) -> list[KeyPoint]:
        """Extract key points with automatic fallback."""
        return await self._generate_with_fallback("extract_key_points", material_context)

    async def generate_quiz(self, material_context: str) -> list[QuizQuestion]:
        """Generate quiz with automatic fallback."""
        return await self._generate_with_fallback("generate_quiz", material_context)

    async def generate_study_plan(
        self,
        tasks: list[dict],
        available_hours_per_day: float,
        start_date: date,
        end_date: date,
    ) -> list[StudySession]:
        """Generate study plan with automatic fallback."""
        return await self._generate_with_fallback(
            "generate_study_plan", tasks, available_hours_per_day, start_date, end_date
        )

    async def prioritize_tasks(self, tasks: list[dict]) -> list[PrioritizedTask]:
        """Prioritize tasks with automatic fallback."""
        return await self._generate_with_fallback("prioritize_tasks", tasks)
