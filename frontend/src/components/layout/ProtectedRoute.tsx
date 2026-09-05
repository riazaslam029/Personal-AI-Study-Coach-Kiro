import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function ProtectedRoute() {
  const { accessToken, setAuth, clearAuth } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let isMounted = true

    // If we already have a token, no need to check
    if (accessToken) {
      setIsChecking(false)
      return
    }

    // Try silent refresh on mount if no token
    api.post('/api/v1/auth/refresh')
      .then(({ data }) => {
        if (!isMounted) return
        // Get user info
        return api.get('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${data.access_token}` }
        }).then(({ data: user }) => {
          if (isMounted) {
            setAuth(user, data.access_token)
            setIsChecking(false)
          }
        })
      })
      .catch(() => {
        if (isMounted) {
          clearAuth()
          setIsChecking(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, []) // Run only once on mount

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If no token after check, redirect to login
  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
