import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Filter, Search } from 'lucide-react'
import api from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
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
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <button
          onClick={() => {
            setEditingTask(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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

      {/* Task List */}
      {isLoading ? (
        <div className="text-center py-12">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No tasks found. Create your first task to get started!
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-4">{task ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={formData.task_type}
                onChange={(e) => setFormData({ ...formData, task_type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="task">Task</option>
                <option value="assignment">Assignment</option>
                <option value="exam">Exam</option>
                <option value="reading">Reading</option>
                <option value="project">Project</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course
              </label>
              <select
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  }

  const typeIcons = {
    task: '📝',
    assignment: '📄',
    exam: '🎓',
    reading: '📚',
    project: '🚀',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-2xl">{typeIcons[task.task_type]}</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
            {task.description && (
              <p className="text-gray-600 text-sm mt-1">{task.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {task.task_type}
              </span>
              {course && (
                <span
                  className="px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: course.color || '#6366f1' }}
                >
                  {course.name}
                </span>
              )}
              {task.difficulty && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Difficulty: {task.difficulty}/5
                </span>
              )}
              {task.estimated_hours && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {task.estimated_hours}h
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-gray-600 hover:text-indigo-600"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="text-gray-600 hover:text-red-600"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {task.deadline && (
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
              📅 Due: {new Date(task.deadline).toLocaleDateString()}
              {isOverdue && ' (Overdue!)'}
            </span>
          )}
          <span>Status: {task.status.replace('_', ' ')}</span>
        </div>
        {task.status !== 'completed' && (
          <button
            onClick={onComplete}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            ✓ Mark Complete
          </button>
        )}
      </div>
    </div>
  )
}
