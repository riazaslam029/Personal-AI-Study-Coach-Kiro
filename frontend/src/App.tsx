import { Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import MaterialsPage from './pages/MaterialsPage'
import AssistantPage from './pages/AssistantPage'
import PlannerPage from './pages/PlannerPage'
import ProgressPage from './pages/ProgressPage'
import AuthLayout from './components/layout/AuthLayout'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/progress" element={<ProgressPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
