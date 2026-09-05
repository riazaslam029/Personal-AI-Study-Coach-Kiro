import { useQuery } from '@tanstack/react-query'
import { Calendar, AlertCircle, Sparkles, TrendingUp, BookOpen } from 'lucide-react'
import { format, isToday, isPast, parseISO } from 'date-fns'
import api from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import type { Task } from '../types'

interface StudySession {
  id: string
  session_date: string
  course_id: string | null
  course_name: string | null
  course_color: string | null
  task_id: string | null
  task_title: string
  duration_minutes: number
  session_type: string
  rationale: string | null
  is_completed: boolean
  generated_at: string
}

export default function DashboardPage() {
  // Fetch tasks with error handling
  const { data: tasks = [] } = useQuery({
    queryKey: queryKeys.tasks.all,
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/tasks')
        return res.data || []
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
        return []
      }
    },
  })

  // Fetch study sessions with error handling
  const { data: sessionsData } = useQuery({
    queryKey: queryKeys.plan.current,
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/plan')
        return res.data
      } catch (error) {
        console.error('Failed to fetch plan:', error)
        return null
      }
    },
    retry: false,
  })

  // Fetch AI prioritization
  const { data: prioritization } = useQuery({
    queryKey: queryKeys.ai.prioritization,
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/ai/prioritize/latest')
        return res.data
      } catch (error) {
        console.error('Failed to fetch prioritization:', error)
        return null
      }
    },
    retry: false,
  })

  // Extract sessions array safely
  const sessions: StudySession[] = sessionsData?.sessions_by_date 
    ? Object.values(sessionsData.sessions_by_date).flat()
    : sessionsData?.sessions || []

  // Get today's sessions - fixed field name and date parsing
  const todaySessions = sessions.filter((s: StudySession) => {
    try {
      const sessionDate = typeof s.session_date === 'string' 
        ? parseISO(s.session_date) 
        : new Date(s.session_date)
      return isToday(sessionDate)
    } catch (error) {
      console.error('Error parsing session date:', error)
      return false
    }
  })

  // Get upcoming deadlines - fixed field names
  const upcomingDeadlines = tasks
    .filter((t: Task) => {
      try {
        if (!t.deadline) return false
        const deadlineDate = typeof t.deadline === 'string' 
          ? parseISO(t.deadline) 
          : new Date(t.deadline)
        return !isPast(deadlineDate) && t.status !== 'completed'
      } catch (error) {
        console.error('Error parsing task deadline:', error)
        return false
      }
    })
    .sort((a: Task, b: Task) => {
      try {
        const dateA = typeof a.deadline === 'string' ? parseISO(a.deadline!) : new Date(a.deadline!)
        const dateB = typeof b.deadline === 'string' ? parseISO(b.deadline!) : new Date(b.deadline!)
        return dateA.getTime() - dateB.getTime()
      } catch (error) {
        return 0
      }
    })
    .slice(0, 5)

  // Calculate progress
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t: Task) => t.status === 'completed').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks"
          value={totalTasks}
          icon={<BookOpen className="w-6 h-6" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Completed"
          value={completedTasks}
          icon={<TrendingUp className="w-6 h-6" />}
          color="bg-green-500"
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={<Sparkles className="w-6 h-6" />}
          color="bg-indigo-500"
        />
        <StatCard
          title="Today's Sessions"
          value={todaySessions.length}
          icon={<Calendar className="w-6 h-6" />}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Study Sessions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Today's Study Sessions
          </h2>
          {todaySessions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sessions scheduled for today</p>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((session: StudySession) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-lg border ${
                    session.is_completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">{String(session.task_title)}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {String(session.duration_minutes)} minutes • {String(session.session_type)}
                  </p>
                  {session.is_completed && (
                    <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            Upcoming Deadlines
          </h2>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming deadlines</p>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((task: Task) => (
                <div key={task.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <h3 className="font-semibold text-gray-900">{String(task.title)}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Due: {format(
                      typeof task.deadline === 'string' 
                        ? parseISO(task.deadline) 
                        : new Date(task.deadline!), 
                      'MMM d, yyyy'
                    )}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {String(task.priority)}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-800">
                      {String(task.task_type)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      {prioritization && prioritization.prioritized_tasks && prioritization.prioritized_tasks.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            AI Recommendations
          </h2>
          <div className="space-y-3">
            {prioritization.prioritized_tasks.slice(0, 3).map((item: any, i: number) => (
              <div key={i} className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl font-bold text-indigo-600">#{String(item.priority_rank)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {String(tasks.find((t: Task) => t.id === item.task_id)?.title || 'Task')}
                    </h3>
                    <p className="text-sm text-gray-700 mt-1">{String(item.explanation)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${color} text-white p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  )
}
