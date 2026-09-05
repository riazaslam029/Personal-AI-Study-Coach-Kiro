import { useQuery } from '@tanstack/react-query'
import { Calendar, AlertCircle, Sparkles, TrendingUp, BookOpen, Target, Clock, Award } from 'lucide-react'
import { format, isToday, isPast, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
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
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-academic-800 to-academic-700 rounded-card p-8 text-white shadow-elevated">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 tracking-tight">Welcome back, Scholar</h1>
            <p className="text-academic-200 text-lg mb-6">
              {completionRate >= 70 
                ? "You're making excellent progress! Keep up the momentum."
                : "Let's make today productive. Your study plan is ready."}
            </p>
            <div className="flex gap-4">
              <Link 
                to="/planner" 
                className="px-6 py-3 bg-white text-academic-800 rounded-lg font-semibold hover:bg-cream-50 transition-all shadow-md hover:shadow-lg"
              >
                View Study Plan
              </Link>
              <Link 
                to="/assistant" 
                className="px-6 py-3 bg-academic-600 text-white rounded-lg font-semibold hover:bg-academic-500 transition-all border border-academic-500"
              >
                Ask AI Assistant
              </Link>
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center w-32 h-32 bg-white/10 rounded-full border-4 border-white/20">
            <Award className="w-16 h-16 text-amber-300" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks"
          value={totalTasks}
          subtitle="across all courses"
          icon={<Target className="w-6 h-6" />}
          color="bg-academic-600"
          trend={null}
        />
        <StatCard
          title="Completed"
          value={completedTasks}
          subtitle={`${completionRate}% completion rate`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="bg-forest-600"
          trend="up"
        />
        <StatCard
          title="Today's Sessions"
          value={todaySessions.length}
          subtitle={todaySessions.length > 0 ? "scheduled for today" : "no sessions today"}
          icon={<Calendar className="w-6 h-6" />}
          color="bg-amber-600"
          trend={null}
        />
        <StatCard
          title="Study Streak"
          value="0"
          subtitle="consecutive days"
          icon={<Sparkles className="w-6 h-6" />}
          color="bg-sage-600"
          trend={null}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Study Sessions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-academic-600" />
              Today's Study Sessions
            </h2>
            <Link to="/planner" className="text-sm text-academic-600 hover:text-academic-700 font-medium">
              View All →
            </Link>
          </div>
          {todaySessions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No sessions scheduled for today</p>
              <Link to="/planner" className="text-sm text-academic-600 hover:text-academic-700 mt-2 inline-block">
                Generate a study plan
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((session: StudySession) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-lg border-l-4 transition-all ${
                    session.is_completed
                      ? 'bg-sage-50 border-sage-500'
                      : 'bg-cream-50 border-academic-500 hover:bg-cream-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{String(session.task_title)}</h3>
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {String(session.duration_minutes)} min • {String(session.session_type).replace('_', ' ')}
                      </p>
                    </div>
                    {session.is_completed && (
                      <span className="badge-success">Completed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Upcoming Deadlines
            </h2>
            <Link to="/tasks" className="text-sm text-academic-600 hover:text-academic-700 font-medium">
              View All →
            </Link>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No upcoming deadlines</p>
              <Link to="/tasks" className="text-sm text-academic-600 hover:text-academic-700 mt-2 inline-block">
                Create a task
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((task: Task) => (
                <div key={task.id} className="p-4 rounded-lg bg-cream-50 border border-gray-200 hover:border-academic-300 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1">{String(task.title)}</h3>
                    <span className={`badge ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : task.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                        : 'bg-sage-100 text-sage-700 border-sage-200'
                    }`}>
                      {String(task.priority)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Due {format(
                      typeof task.deadline === 'string' 
                        ? parseISO(task.deadline) 
                        : new Date(task.deadline!), 
                      'MMM d, yyyy'
                    )}
                  </p>
                  {task.course_name && (
                    <div className="flex items-center gap-2 mt-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: task.course_color || '#1E293B' }}
                      />
                      <span className="text-xs text-gray-500">{task.course_name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      {prioritization && prioritization.prioritized_tasks && prioritization.prioritized_tasks.length > 0 && (
        <div className="card p-6 bg-gradient-to-br from-academic-50 to-white border-academic-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            AI Study Recommendations
          </h2>
          <p className="text-sm text-gray-600 mb-5">AI-prioritized tasks based on deadlines, difficulty, and importance</p>
          <div className="space-y-3">
            {prioritization.prioritized_tasks.slice(0, 3).map((item: any, i: number) => (
              <div key={i} className="p-5 rounded-lg bg-white border border-academic-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    #{String(item.priority_rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {String(tasks.find((t: Task) => t.id === item.task_id)?.title || 'Task')}
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{String(item.explanation)}</p>
                    <Link 
                      to="/tasks" 
                      className="text-xs text-academic-600 hover:text-academic-700 font-medium mt-2 inline-block"
                    >
                      View Task Details →
                    </Link>
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
  subtitle,
  icon,
  color,
  trend,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  color: string
  trend: 'up' | 'down' | null
}) {
  return (
    <div className="card p-6 hover:shadow-card-hover transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`${color} text-white p-3 rounded-lg shadow-sm`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-sage-100 text-sage-700' : 'bg-red-100 text-red-700'
          }`}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  )
}
