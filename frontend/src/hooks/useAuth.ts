import { useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

interface LoginData {
  email: string
  password: string
}

interface RegisterData extends LoginData {
  full_name?: string
}

export function useLogin() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await api.post('/api/v1/auth/login', data)
      return response.data
    },
    onSuccess: async (data) => {
      // Get user info
      const userResponse = await api.get('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${data.access_token}` }
      })
      setAuth(userResponse.data, data.access_token)
      navigate('/dashboard')
    },
  })
}

export function useRegister() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const userResponse = await api.post('/api/v1/auth/register', data)
      // Auto-login after registration
      const loginResponse = await api.post('/api/v1/auth/login', {
        email: data.email,
        password: data.password,
      })
      return { user: userResponse.data, token: loginResponse.data.access_token }
    },
    onSuccess: ({ user, token }) => {
      setAuth(user, token)
      navigate('/dashboard')
    },
  })
}

export function useLogout() {
  const { clearAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async () => {
      await api.post('/api/v1/auth/logout')
    },
    onSuccess: () => {
      clearAuth()
      navigate('/login')
    },
  })
}
