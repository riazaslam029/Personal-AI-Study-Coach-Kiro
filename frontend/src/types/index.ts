// All shared TypeScript interfaces for the Study Coach app

export interface User {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

export interface Course {
  id: string
  name: string
  description: string | null
  color: string
  task_count: number
  completed_task_count: number
  material_count: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  course_id: string | null
  course_name: string | null
  course_color: string | null
  title: string
  description: string | null
  task_type: 'task' | 'assignment' | 'exam' | 'reading' | 'project'
  status: 'not_started' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  difficulty: number | null
  estimated_hours: number | null
  deadline: string | null
  completed_at: string | null
  is_overdue: boolean
  created_at: string
  updated_at: string
}

export interface StudyMaterial {
  id: string
  course_id: string | null
  title: string
  source_type: 'pdf' | 'txt' | 'markdown' | 'pasted_text'
  original_filename: string | null
  file_size_bytes: number | null
  extraction_warning: boolean
  created_at: string
  updated_at: string
}

export interface StudyMaterialDetail extends StudyMaterial {
  extracted_text: string
}

export interface StudyPlanSession {
  id: string
  session_date: string
  course_id: string | null
  course_name: string | null
  course_color: string | null
  task_id: string | null
  task_title: string
  duration_minutes: number
  session_type: 'study' | 'revision' | 'exam_prep' | 'assignment'
  rationale: string | null
  is_completed: boolean
  generated_at: string
}

// Alias for compatibility
export type StudySession = StudyPlanSession

export interface PrioritizedTask {
  task_id: string
  task_title: string
  priority_rank: number
  explanation: string
}

export interface KeyPoint {
  point: string
  importance: 'high' | 'medium' | 'low'
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct_answer: string
  explanation: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface CourseStats {
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  overdue_tasks: number
  estimated_hours_total: number
  estimated_hours_completed: number
}

// Request types
export interface TaskFilters {
  course_id?: string
  status?: string
  task_type?: string
  priority?: string
  deadline_from?: string
  deadline_to?: string
  sort_by?: 'deadline' | 'priority' | 'estimated_hours' | 'created_at'
  sort_order?: 'asc' | 'desc'
}
