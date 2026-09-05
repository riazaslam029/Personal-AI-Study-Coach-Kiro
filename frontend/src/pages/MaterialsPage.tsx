import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, Plus, Trash2 } from 'lucide-react'
import api from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import type { StudyMaterial, Course } from '../types'

// Helper function to format error messages
const formatError = (error: any): string => {
  if (typeof error === 'string') return error
  
  // Handle Axios error response
  if (error?.response?.data) {
    const data = error.response.data
    
    // Pydantic validation error format
    if (data.detail && Array.isArray(data.detail)) {
      return data.detail.map((err: any) => 
        `${err.loc?.join(' → ') || 'Field'}: ${err.msg || 'Invalid'}`
      ).join(', ')
    }
    
    // Simple string detail
    if (typeof data.detail === 'string') {
      return data.detail
    }
    
    // Other error formats
    return data.message || JSON.stringify(data)
  }
  
  return error?.message || 'An error occurred'
}

export default function MaterialsPage() {
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [showPasteForm, setShowPasteForm] = useState(false)

  const queryClient = useQueryClient()

  // Fetch materials
  const { data: materials = [], isLoading } = useQuery({
    queryKey: queryKeys.materials.all,
    queryFn: async () => {
      const res = await api.get('/api/v1/materials')
      return res.data
    },
  })

  // Fetch courses
  const { data: courses = [] } = useQuery({
    queryKey: queryKeys.courses.all,
    queryFn: async () => {
      const res = await api.get('/api/v1/courses')
      return res.data
    },
  })

  // Upload file mutation
  const uploadFile = useMutation({
    mutationFn: async ({ file, courseId, title }: { file: File; courseId?: string; title?: string }) => {
      const formData = new FormData()
      formData.append('file', file)
      if (courseId) formData.append('course_id', courseId)
      if (title) formData.append('title', title)

      const res = await api.post('/api/v1/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all })
      setShowUploadForm(false)
    },
  })

  // Paste text mutation
  const pasteText = useMutation({
    mutationFn: async ({ text, courseId, title }: { text: string; courseId?: string; title: string }) => {
      const res = await api.post('/api/v1/materials/paste', {
        content: text,
        title,
        course_id: courseId,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all })
      setShowPasteForm(false)
    },
  })

  // Delete material mutation
  const deleteMaterial = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/materials/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all })
    },
  })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Study Materials</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPasteForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FileText className="w-5 h-5" />
            Paste Text
          </button>
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Upload className="w-5 h-5" />
            Upload File
          </button>
        </div>
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <UploadForm
          courses={courses}
          onSubmit={(data) => uploadFile.mutate(data)}
          onCancel={() => setShowUploadForm(false)}
          isLoading={uploadFile.isPending}
          error={uploadFile.error}
        />
      )}

      {/* Paste Form Modal */}
      {showPasteForm && (
        <PasteForm
          courses={courses}
          onSubmit={(data) => pasteText.mutate(data)}
          onCancel={() => setShowPasteForm(false)}
          isLoading={pasteText.isPending}
          error={pasteText.error}
        />
      )}

      {/* Materials Grid */}
      {isLoading ? (
        <div className="text-center py-12">Loading materials...</div>
      ) : materials.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p>No study materials yet. Upload a file or paste text to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material: StudyMaterial) => (
            <MaterialCard
              key={material.id}
              material={material}
              courses={courses}
              onDelete={() => {
                if (confirm('Delete this material?')) {
                  deleteMaterial.mutate(material.id)
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Upload Form Component
function UploadForm({
  courses,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: {
  courses: Course[]
  onSubmit: (data: { file: File; courseId?: string; title?: string }) => void
  onCancel: () => void
  isLoading: boolean
  error: any
}) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (file) {
      onSubmit({ file, courseId: courseId || undefined, title: title || undefined })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Upload Study Material</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File * (PDF, TXT, MD - Max 10MB)
            </label>
            <input
              type="file"
              required
              accept=".pdf,.txt,.md"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            {file && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave empty to use filename"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course (optional)
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
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

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {formatError(error)}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || !file}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Uploading...' : 'Upload'}
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

// Paste Form Component
function PasteForm({
  courses,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: {
  courses: Course[]
  onSubmit: (data: { text: string; courseId?: string; title: string }) => void
  onCancel: () => void
  isLoading: boolean
  error: any
}) {
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ text, courseId: courseId || undefined, title })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Paste Study Material</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chapter 3 Notes"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content *
            </label>
            <textarea
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              placeholder="Paste your study notes, lecture content, or any text material here..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            />
            <p className="text-sm text-gray-500 mt-1">{text.length} characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course (optional)
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
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

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {formatError(error)}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || !text || !title}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Material'}
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

// Material Card Component
function MaterialCard({
  material,
  courses,
  onDelete,
}: {
  material: StudyMaterial
  courses: Course[]
  onDelete: () => void
}) {
  const course = courses.find((c: Course) => c.id === material.course_id)

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.pdf')) return '📕'
    if (filename.endsWith('.txt')) return '📄'
    if (filename.endsWith('.md')) return '📝'
    return '📄'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-3xl">{getFileIcon(material.original_filename || "")}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {material.title}
            </h3>
            <p className="text-sm text-gray-500 truncate">{material.original_filename || "Pasted text"}</p>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-600"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {course && (
        <div className="mb-3">
          <span
            className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: course.color || '#6366f1' }}
          >
            {course.name}
          </span>
        </div>
      )}

      <div className="text-sm text-gray-600 space-y-1">
        <p>📊 {(material.file_size_bytes || 0).toLocaleString()} bytes</p>
        <p>📅 Uploaded {new Date(material.created_at).toLocaleDateString()}</p>
        {material.extraction_warning && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            ⚠️ Text extraction may be incomplete
          </div>
        )}
      </div>
    </div>
  )
}
