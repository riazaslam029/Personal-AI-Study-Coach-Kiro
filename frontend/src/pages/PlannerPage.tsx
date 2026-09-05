import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Clock, Plus, Sparkles, Check } from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns'
import api from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import type { StudySession } from '../types'

export default function PlannerPage() {
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(new Date())

  const queryClient = useQueryClient()

  // Fetch study plan
  const { data: planData, isLoading } = useQuery({
    queryKey: queryKeys.plan.current,
    queryFn: async () => {
      const res = await api.get('/api/v1/plan/')
      return res.data
    },
  })

  // Extract sessions from the response
  const sessions: StudySession[] = planData?.sessions_by_date 
    ? Object.values(planData.sessions_by_date).flat()
    : []

  // Generate plan mutation
  const generatePlan = useMutation({
    mutationFn: async (data: {
      start_date: string
      end_date: string
      available_hours_per_day: { [key: string]: number }
    }) => {
      const res = await api.post('/api/v1/plan/generate', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plan.current })
      setShowGenerateForm(false)
    },
  })

  // Mark session complete
  const markComplete = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/v1/plan/sessions/${id}/complete`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plan.current })
    },
  })

  // Group sessions by date
  const sessionsByDate: { [key: string]: StudySession[] } = {}
  sessions.forEach((session: StudySession) => {
    const dateKey = session.date
    if (!sessionsByDate[dateKey]) {
      sessionsByDate[dateKey] = []
    }
    sessionsByDate[dateKey].push(session)
  })

  // Get week days
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Study Planner</h1>
        <button
          onClick={() => setShowGenerateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Sparkles className="w-5 h-5" />
          Generate AI Plan
        </button>
      </div>

      {/* Generate Form Modal */}
      {showGenerateForm && (
        <GeneratePlanForm
          onSubmit={(data) => generatePlan.mutate(data)}
          onCancel={() => setShowGenerateForm(false)}
          isLoading={generatePlan.isPending}
          error={generatePlan.error}
        />
      )}

      {/* Week Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            ← Previous Week
          </button>
          <h2 className="text-lg font-semibold">
            {format(weekStart, 'MMM d')} - {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
          </h2>
          <button
            onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Next Week →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="text-center py-12">Loading plan...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p>No study plan yet. Generate an AI-powered study plan to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const daySessions = sessionsByDate[dateKey] || []
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

            return (
              <div
                key={dateKey}
                className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                  isToday ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                <div className={`p-3 ${isToday ? 'bg-indigo-600 text-white' : 'bg-gray-50'}`}>
                  <div className="text-xs font-medium uppercase">
                    {format(day, 'EEE')}
                  </div>
                  <div className="text-2xl font-bold">{format(day, 'd')}</div>
                </div>
                <div className="p-2 space-y-2 min-h-[200px]">
                  {daySessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onComplete={() => markComplete.mutate(session.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Session Card Component
function SessionCard({
  session,
  onComplete,
}: {
  session: StudySession
  onComplete: () => void
}) {
  const typeColors = {
    study: 'bg-blue-100 border-blue-300 text-blue-800',
    exam_prep: 'bg-red-100 border-red-300 text-red-800',
    review: 'bg-green-100 border-green-300 text-green-800',
    assignment: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  }

  return (
    <div
      className={`p-2 rounded border ${
        session.completed ? 'opacity-50' : ''
      } ${typeColors[session.session_type as keyof typeof typeColors] || 'bg-gray-100 border-gray-300'}`}
    >
      <div className="flex items-start justify-between mb-1">
        <h4 className="text-xs font-semibold line-clamp-2">{session.task_title}</h4>
        {!session.completed && (
          <button
            onClick={onComplete}
            className="text-green-600 hover:text-green-700 flex-shrink-0"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="text-xs flex items-center gap-1 text-gray-600">
        <Clock className="w-3 h-3" />
        {session.duration_minutes}m
      </div>
      {session.rationale && (
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{session.rationale}</p>
      )}
      {session.completed && (
        <div className="text-xs text-green-600 font-medium mt-1">✓ Completed</div>
      )}
    </div>
  )
}

// Generate Plan Form
function GeneratePlanForm({
  onSubmit,
  onCancel,
  isLoading,
  error,
}: {
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading: boolean
  error: any
}) {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'))
  const [hours, setHours] = useState<{ [key: string]: number }>({
    monday: 3,
    tuesday: 3,
    wednesday: 3,
    thursday: 3,
    friday: 3,
    saturday: 5,
    sunday: 5,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      start_date: startDate,
      end_date: endDate,
      available_hours_per_day: hours,
    })
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Generate AI Study Plan</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Available Hours Per Day
            </label>
            <div className="space-y-2">
              {days.map((day) => (
                <div key={day} className="flex items-center gap-3">
                  <label className="w-24 text-sm capitalize">{day}</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={hours[day]}
                    onChange={(e) =>
                      setHours({ ...hours, [day]: parseFloat(e.target.value) })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-600">hours</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {typeof error?.response?.data?.detail === 'string' 
                ? error.response.data.detail 
                : 'Failed to generate plan. Please check your inputs and try again.'}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Generate Plan'}
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
