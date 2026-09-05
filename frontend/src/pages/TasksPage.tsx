import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Filter, Search, CheckCircle2, Circle, Clock, AlertTriangle, Edit2, Trash2, ListTodo } from 'lucide-react'
import { format, parseISO, isPast } from 'date-fns'
import api from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import EmptyState from '../components/EmptyState'
import type { Task, Course } from '../types'

interface TaskFormData {
  title: string
  description?: string
  task_type: 'task' | 'assignment' | 'exam' | 'reading' | 'project'
  priority: 'low' | 'medium' | 'high'
  difficulty?: number
  estimated_hours?: number
  deadline?: string
  course_id?: string
}

export default function TasksPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    type: 'all',
    search: '',
  })

  const queryClient = useQueryClient()

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: queryKeys.tasks.all,
    queryFn: async () => {
      const res = await api.get('/api/v1/tasks')
      return res.data
    },
  })

  // Fetch courses for dropdown
  const { data: courses = [] } = useQuery({
    queryKey: queryKeys.courses.all,
    queryFn: async () => {
      const res = await api.get('/api/v1/courses')
      return res.data
    },
  })

  // Create task mutation
  const createTask = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const res = await api.post('/api/v1/tasks', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      setShowForm(false)
    },
  })

  // Update task mutation
  const updateTask = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskFormData> }) => {
      const res = await api.patch(`/api/v1/tasks/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      setEditingTask(null)
      setShowForm(false)
    },
  })

  // Delete task mutation
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/tasks/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
    },
  })

  // Mark complete mutation
  const markComplete = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/v1/tasks/${id}/complete`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
    },
  })

  // Filter tasks
  const filteredTasks = tasks.filter((task: Task) => {
    if (filters.status !== 'all' && task.status !== filters.status) return false
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false
    if (filters.type !== 'all' && task.task_type !== filters.type) return false
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  const handleSubmit = (data: TaskFormData) => {
    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, data })
    } else {
      createTask.mutate(data)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tasks & Assignments</h1>
          <p className="text-gray-600">Organize and track all your academic work</p>
        </div>
        <button
          onClick={() => {
            setEditingTask(null)
            setShowForm(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-academic-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="input-field"
          >
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="input-field"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="input-field"
          >
            <option value="all">All Types</option>
            <option value="task">Task</option>
            <option value="assignment">Assignment</option>
            <option value="exam">Exam</option>
            <option value="reading">Reading</option>
            <option value="project">Project</option>
          </select>
        </div>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          courses={courses}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false)
            setEditingTask(null)
          }}
          isLoading={createTask.isPending || updateTask.isPending}
        />
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 bg-gradient-to-br from-academic-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-academic-100 flex items-center justify-center">
              <Circle className="w-6 h-6 text-academic-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter((t: Task) => t.status === 'not_started').length}
              </p>
              <p className="text-sm text-gray-600">Not Started</p>
            </div>
          </div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-amber-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter((t: Task) => t.status === 'in_progress').length}
              </p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-sage-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-sage-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-sage-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter((t: Task) => t.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="card p-12 text-center">
          <div className="animate-pulse">Loading tasks...</div>
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks yet!"
          description="Create your first task to start organizing your academic work. Break down assignments, readings, and projects into manageable pieces."
          action={{
            label: 'Create Your First Task',
            onClick: () => {
              setEditingTask(null)
              setShowForm(true)
            }
          }}
          illustration="tasks"
        />
      ) : filteredTasks.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
          <button
            onClick={() => setFilters({ status: 'all', priority: 'all', type: 'all', search: '' })}
            className="btn-secondary"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task: Task) => (
            <TaskCard
              key={task.id}
              task={task}
              courses={courses}
              onEdit={() => {
                setEditingTask(task)
                setShowForm(true)
              }}
              onDelete={() => {
                if (confirm('Delete this task?')) {
                  deleteTask.mutate(task.id)
                }
              }}
              onComplete={() => markComplete.mutate(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Task Form Component
function TaskForm({
  task,
  courses,
  onSubmit,
  onCancel,
  isLoading,
}: {
  task: Task | null
  courses: Course[]
  onSubmit: (data: TaskFormData) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    task_type: task?.task_type || 'task',
    priority: task?.priority || 'medium',
    difficulty: task?.difficulty || 3,
    estimated_hours: task?.estimated_hours || 1,
    deadline: task?.deadline ? task.deadline.split('T')[0] : '',
    course_id: task?.course_id || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-card shadow-elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          {task ? 'Edit Task' : 'Create New Task'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Complete Chapter 5 Exercises"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Add any additional details..."
              className="input-field resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.task_type}
                onChange={(e) => setFormData({ ...formData, task_type: e.target.value as any })}
                className="input-field"
              >
                <option value="task">Task</option>
                <option value="assignment">Assignment</option>
                <option value="exam">Exam</option>
                <option value="reading">Reading</option>
                <option value="project">Project</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="input-field"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Difficulty Level
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">1 (Easy) to 10 (Very Hard)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Estimated Hours
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">Time needed to complete</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Course
              </label>
              <select
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                className="input-field"
              >
                <option value="">No course</option>
                {courses.map((course: Course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Task Card Component
function TaskCard({
  task,
  courses,
  onEdit,
  onDelete,
  onComplete,
}: {
  task: Task
  courses: Course[]
  onEdit: () => void
  onDelete: () => void
  onComplete: () => void
}) {
  const course = courses.find((c: Course) => c.id === task.course_id)
  const isOverdue = task.deadline && isPast(parseISO(task.deadline)) && task.status !== 'completed'
  const isCompleted = task.status === 'completed'

  const statusConfig = {
    not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Circle },
    in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    completed: { label: 'Completed', color: 'bg-sage-100 text-sage-700 border-sage-200', icon: CheckCircle2 },
  }

  const priorityConfig = {
    low: { label: 'Low Priority', color: 'bg-sage-100 text-sage-700 border-sage-200' },
    medium: { label: 'Medium Priority', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    high: { label: 'High Priority', color: 'bg-red-100 text-red-700 border-red-200' },
  }

  const typeEmoji = {
    task: '📝',
    assignment: '📄',
    exam: '🎓',
    reading: '📚',
    project: '🚀',
  }

  const StatusIcon = statusConfig[task.status].icon

  return (
    <div className={`card p-6 transition-all ${isCompleted ? 'opacity-75' : 'hover:shadow-card-hover'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 rounded-lg bg-cream-100 flex items-center justify-center text-2xl flex-shrink-0">
            {typeEmoji[task.task_type]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
            {task.description && (
              <p className="text-gray-600 text-sm leading-relaxed mb-3">{task.description}</p>
            )}
            
            <div className="flex flex-wrap gap-2">
              <span className={`badge ${statusConfig[task.status].color}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig[task.status].label}
              </span>
              <span className={`badge ${priorityConfig[task.priority].color}`}>
                {priorityConfig[task.priority].label}
              </span>
              <span className="badge-info capitalize">
                {task.task_type.replace('_', ' ')}
              </span>
              {course && (
                <span
                  className="badge text-white border-0"
                  style={{ backgroundColor: course.color || '#1E293B' }}
                >
                  {course.name}
                </span>
              )}
              {task.difficulty && task.difficulty > 0 && (
                <span className="badge bg-academic-100 text-academic-700 border-academic-200">
                  Difficulty: {task.difficulty}/10
                </span>
              )}
              {task.estimated_hours && task.estimated_hours > 0 && (
                <span className="badge bg-amber-100 text-amber-700 border-amber-200">
                  <Clock className="w-3 h-3 mr-1" />
                  {task.estimated_hours}h
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 flex-shrink-0 ml-4">
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:text-academic-600 hover:bg-academic-50 rounded-lg transition-colors"
            title="Edit Task"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Task"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-sm">
          {task.deadline && (
            <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
              {isOverdue && <AlertTriangle className="w-4 h-4" />}
              📅 Due {format(parseISO(task.deadline), 'MMM d, yyyy')}
              {isOverdue && <span className="badge bg-red-100 text-red-700 border-red-200 ml-2">Overdue!</span>}
            </div>
          )}
        </div>
        {!isCompleted && (
          <button
            onClick={onComplete}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark Complete
          </button>
        )}
      </div>
    </div>
  )
}
