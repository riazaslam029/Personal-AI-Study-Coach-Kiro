import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Clock, Target } from 'lucide-react'
import api from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import type { Task, Course, StudySession } from '../types'

export default function ProgressPage() {
  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: queryKeys.tasks.all,
    queryFn: async () => {
      const res = await api.get('/api/v1/tasks')
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

  // Fetch study sessions
  const { data: planData } = useQuery({
    queryKey: queryKeys.plan.current,
    queryFn: async () => {
      const res = await api.get('/api/v1/plan/')
      return res.data
    },
  })

  // Extract sessions array from plan data
  const sessions: StudySession[] = planData?.sessions_by_date 
    ? Object.values(planData.sessions_by_date).flat()
    : []

  // Calculate overall progress
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t: Task) => t.status === 'completed').length
  const inProgressTasks = tasks.filter((t: Task) => t.status === 'in_progress').length
  const pendingTasks = tasks.filter((t: Task) => t.status === 'not_started').length

  // Calculate hours
  const totalEstimatedHours = tasks.reduce((sum: number, t: Task) => sum + (t.estimated_hours || 0), 0)
  const completedHours = tasks
    .filter((t: Task) => t.status === 'completed')
    .reduce((sum: number, t: Task) => sum + (t.estimated_hours || 0), 0)

  const plannedHours = sessions.reduce((sum: number, s: StudySession) => sum + s.duration_minutes / 60, 0)
  const completedSessionHours = sessions
    .filter((s: StudySession) => s.is_completed)
    .reduce((sum: number, s: StudySession) => sum + s.duration_minutes / 60, 0)

  // Calculate per-course stats
  const courseStats = courses.map((course: Course) => {
    const courseTasks = tasks.filter((t: Task) => t.course_id === course.id)
    const completed = courseTasks.filter((t: Task) => t.status === 'completed').length
    const total = courseTasks.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      course,
      total,
      completed,
      percentage,
    }
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Progress Tracking</h1>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Task Completion</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completed</span>
              <span className="font-medium">{completedTasks} / {totalTasks}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all"
                style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
              />
            </div>
            <div className="flex gap-4 text-xs text-gray-600 mt-3">
              <span>✓ {completedTasks} done</span>
              <span>🔄 {inProgressTasks} in progress</span>
              <span>⏳ {pendingTasks} pending</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Hours (Tasks)</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Completed</span>
              <span className="font-medium text-2xl text-green-600">
                {completedHours.toFixed(1)}h
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Total Estimated</span>
              <span className="font-medium text-gray-900">
                {totalEstimatedHours.toFixed(1)}h
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${totalEstimatedHours > 0 ? (completedHours / totalEstimatedHours) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Hours (Sessions)</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Completed</span>
              <span className="font-medium text-2xl text-purple-600">
                {completedSessionHours.toFixed(1)}h
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Planned</span>
              <span className="font-medium text-gray-900">
                {plannedHours.toFixed(1)}h
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
              <div
                className="bg-purple-500 h-3 rounded-full transition-all"
                style={{ width: `${plannedHours > 0 ? (completedSessionHours / plannedHours) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Course Progress */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Progress by Course</h2>
        {courseStats.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No courses yet. Create a course to track progress!</p>
        ) : (
          <div className="space-y-6">
            {courseStats.map((stat: { course: Course; total: number; completed: number; percentage: number }) => (
              <div key={stat.course.id}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: stat.course.color || '#6366f1' }}
                    />
                    <span className="font-semibold text-gray-900">{stat.course.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {stat.completed} / {stat.total} tasks ({stat.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-6 rounded-full transition-all flex items-center justify-end px-3 text-white text-sm font-medium"
                    style={{
                      width: `${stat.percentage}%`,
                      backgroundColor: stat.course.color || '#6366f1',
                      minWidth: stat.percentage > 0 ? '60px' : '0',
                    }}
                  >
                    {stat.percentage > 15 && `${stat.percentage}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Status Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Task Status Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-1">{completedTasks}</div>
            <div className="text-sm text-green-700">Completed Tasks</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-3xl font-bold text-blue-600 mb-1">{inProgressTasks}</div>
            <div className="text-sm text-blue-700">In Progress</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-3xl font-bold text-gray-600 mb-1">{pendingTasks}</div>
            <div className="text-sm text-gray-700">Pending</div>
          </div>
        </div>
      </div>
    </div>
  )
}
