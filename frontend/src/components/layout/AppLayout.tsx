import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { LayoutDashboard, CheckSquare, FileText, MessageSquare, Calendar, BarChart3, LogOut, BookOpen, Plus, X, GraduationCap } from 'lucide-react'
import api from '../../lib/api'
import { queryKeys } from '../../lib/queryKeys'
import type { Course } from '../../types'

export default function AppLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
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

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Refined Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Brand Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-academic-800 to-academic-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">Study Coach</h1>
              <p className="text-xs text-academic-200">AI-Powered Learning</p>
            </div>
          </div>
          <div className="mt-4 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
            <p className="text-xs font-medium text-white/90">Signed in as</p>
            <p className="text-sm text-white font-medium truncate">{user?.email}</p>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isActive(item.to)
                  ? 'bg-academic-50 text-academic-900 shadow-sm border border-academic-100'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={20} strokeWidth={isActive(item.to) ? 2.5 : 2} />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}

          {/* Courses Section */}
          <div className="pt-6 mt-6 border-t border-gray-100">
            <div className="flex items-center justify-between px-4 py-2 mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Courses</h3>
              <button
                onClick={() => setShowCourseForm(true)}
                className="w-6 h-6 rounded-md bg-academic-100 text-academic-700 hover:bg-academic-200 transition-colors flex items-center justify-center"
                title="Add Course"
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>
            <div className="space-y-1">
              {courses.map((course: Course) => (
                <div
                  key={course.id}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                    style={{ backgroundColor: course.color || '#1E293B' }}
                  />
                  <span className="truncate font-medium">{course.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{course.task_count || 0}</span>
                </div>
              ))}
              {courses.length === 0 && (
                <p className="px-4 py-3 text-xs text-gray-400 text-center">No courses added yet</p>
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

        {/* Logout Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all w-full font-medium text-sm"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-cream-50">
        <div className="max-w-7xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}


// Refined Course Form Modal
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
  const [color, setColor] = useState('#1E293B')

  const colors = [
    { value: '#1E293B', name: 'Academic Navy' },
    { value: '#1B4332', name: 'Forest Green' },
    { value: '#3B49DF', name: 'Royal Indigo' },
    { value: '#DC2626', name: 'Crimson' },
    { value: '#D97706', name: 'Amber' },
    { value: '#059669', name: 'Emerald' },
    { value: '#0891B2', name: 'Cyan' },
    { value: '#7C3AED', name: 'Purple' },
    { value: '#DB2777', name: 'Pink' },
    { value: '#475569', name: 'Slate' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, description: description || undefined, color })
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-card shadow-elevated max-w-lg w-full p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add New Course</h2>
            <p className="text-sm text-gray-500 mt-1">Create a course to organize your study materials</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={22} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Course Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Data Structures & Algorithms"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief course description..."
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Course Color
            </label>
            <div className="grid grid-cols-5 gap-3">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-12 rounded-lg transition-all duration-200 ${
                    color === c.value 
                      ? 'ring-2 ring-offset-2 ring-academic-500 scale-105 shadow-md' 
                      : 'hover:scale-105 shadow-sm'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? 'Creating...' : 'Create Course'}
            </button>
            <button
              type="button"
              onClick={onClose}
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
