import { useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { LayoutDashboard, CheckSquare, FileText, MessageSquare, Calendar, BarChart3, LogOut, BookOpen, Plus, X } from 'lucide-react'
import api from '../../lib/api'
import { queryKeys } from '../../lib/queryKeys'
import type { Course } from '../../types'

export default function AppLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [showCourseForm, setShowCourseForm] = useState(false)
  const queryClient = useQueryClient()

  // Fetch courses
  const { data: courses = [] } = useQuery({
    queryKey: queryKeys.courses.all,
    queryFn: async () => {
      const res = await api.get('/api/v1/courses')
      return res.data
    },
  })

  // Create course mutation
  const createCourse = useMutation({
    mutationFn: async (data: { name: string; description?: string; color?: string }) => {
      const res = await api.post('/api/v1/courses', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all })
      setShowCourseForm(false)
    },
  })

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      clearAuth()
      navigate('/login')
    }
  }

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/materials', icon: FileText, label: 'Materials' },
    { to: '/assistant', icon: MessageSquare, label: 'AI Assistant' },
    { to: '/planner', icon: Calendar, label: 'Planner' },
    { to: '/progress', icon: BarChart3, label: 'Progress' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Study Coach</h1>
          <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Courses Section */}
          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="flex items-center justify-between px-4 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">My Courses</h3>
              <button
                onClick={() => setShowCourseForm(true)}
                className="text-indigo-600 hover:text-indigo-700"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-1 mt-2">
              {courses.map((course: Course) => (
                <div
                  key={course.id}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: course.color || '#6366f1' }}
                  />
                  <span className="truncate">{course.name}</span>
                </div>
              ))}
              {courses.length === 0 && (
                <p className="px-4 py-2 text-xs text-gray-500">No courses yet</p>
              )}
            </div>
          </div>
        </nav>

        {/* Course Form Modal */}
        {showCourseForm && (
          <CourseFormModal
            onSubmit={(data) => createCourse.mutate(data)}
            onClose={() => setShowCourseForm(false)}
            isLoading={createCourse.isPending}
          />
        )}

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}


// Course Form Modal Component
function CourseFormModal({
  onSubmit,
  onClose,
  isLoading,
}: {
  onSubmit: (data: { name: string; description?: string; color?: string }) => void
  onClose: () => void
  isLoading: boolean
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6366f1')

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#f59e0b', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6',
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, description: description || undefined, color })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Course</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Data Structures"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Optional course description"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-lg transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Course'}
            </button>
            <button
              type="button"
              onClick={onClose}
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
