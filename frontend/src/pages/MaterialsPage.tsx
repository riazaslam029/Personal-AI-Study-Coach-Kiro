import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, Plus, Trash2, File, FileCheck, AlertCircle, Calendar, HardDrive, BookOpen } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import api from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import EmptyState from '../components/EmptyState'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Materials</h1>
          <p className="text-gray-600">Upload documents and organize your learning resources</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPasteForm(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Paste Text
          </button>
          <button
            onClick={() => setShowUploadForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload PDF
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

      {/* Materials List */}
      {isLoading ? (
        <div className="card p-12 text-center">
          <div className="animate-pulse">Loading materials...</div>
        </div>
      ) : materials.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Your study library is empty"
          description="Upload lecture notes, textbooks, or paste study materials to get started. The AI will help you summarize, extract key points, and generate quizzes from your content."
          action={{
            label: 'Upload Your First Material',
            onClick: () => setShowUploadForm(true)
          }}
          illustration="materials"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {materials.map((material: StudyMaterial) => (
            <MaterialCard
              key={material.id}
              material={material}
              courses={courses}
              onDelete={() => {
                if (confirm('Delete this material? This action cannot be undone.')) {
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-card shadow-elevated max-w-lg w-full p-6 border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Study Material</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              required
              accept=".pdf,.txt,.md"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-academic-100 file:text-academic-700 file:font-medium hover:file:bg-academic-200 file:cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-2">Supported: PDF, TXT, MD • Max 10MB</p>
            {file && (
              <div className="mt-3 p-3 bg-sage-50 border border-sage-200 rounded-lg">
                <p className="text-sm text-sage-800 font-medium">✓ {file.name}</p>
                <p className="text-xs text-sage-600 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Auto-detect from filename"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Course <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
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

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Upload failed</p>
                <p className="text-sm text-red-600 mt-1">{formatError(error)}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isLoading || !file}
              className="btn-primary flex-1"
            >
              {isLoading ? 'Uploading...' : 'Upload Material'}
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-card shadow-elevated max-w-3xl w-full p-6 border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Paste Study Material</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chapter 3: Data Structures Notes"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={14}
              placeholder="Paste your lecture notes, study guides, or any text material here...

Tip: You can paste formatted text and it will be preserved."
              className="input-field resize-none font-mono text-sm"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">{text.length.toLocaleString()} characters</p>
              {text.length > 50000 && (
                <p className="text-xs text-amber-600 font-medium">⚠️ Large content may take longer to process</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Course <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
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

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Failed to save</p>
                <p className="text-sm text-red-600 mt-1">{formatError(error)}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isLoading || !text || !title}
              className="btn-primary flex-1"
            >
              {isLoading ? 'Saving...' : 'Save Material'}
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

  const getFileIcon = (sourceType: string) => {
    if (sourceType === 'pdf') return { icon: File, color: 'text-red-600', bg: 'bg-red-50' }
    if (sourceType === 'txt') return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' }
    if (sourceType === 'markdown') return { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' }
    return { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50' }
  }

  const fileConfig = getFileIcon(material.source_type)
  const FileIcon = fileConfig.icon
  const fileSize = material.file_size_bytes ? (material.file_size_bytes / 1024).toFixed(1) : '0'

  return (
    <div className="card p-6 hover:shadow-card-hover transition-all group">
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-14 h-14 rounded-lg ${fileConfig.bg} flex items-center justify-center flex-shrink-0`}>
          <FileIcon className={`w-7 h-7 ${fileConfig.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {material.title}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {material.original_filename || 'Pasted text content'}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          title="Delete Material"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {course && (
        <div className="mb-4">
          <span
            className="badge text-white border-0"
            style={{ backgroundColor: course.color || '#1E293B' }}
          >
            {course.name}
          </span>
        </div>
      )}

      <div className="space-y-2 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <HardDrive className="w-4 h-4" />
            <span>{fileSize} KB</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{format(parseISO(material.created_at), 'MMM d, yyyy')}</span>
          </div>
        </div>
        
        {material.extraction_warning && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-800">Partial extraction</p>
              <p className="text-xs text-amber-600 mt-0.5">Some text may be incomplete</p>
            </div>
          </div>
        )}
        
        {material.source_type === 'pasted_text' && (
          <div className="badge-info flex items-center gap-1.5">
            <FileCheck className="w-3 h-3" />
            <span>Pasted Content</span>
          </div>
        )}
      </div>
    </div>
  )
}
