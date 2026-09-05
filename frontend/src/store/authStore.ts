// Zustand auth store: user, accessToken, setAuth, clearAuth
import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  user: User | null
  accessToken: string | null
  setAuth: (user: User, token: string) => void
  setAccessToken: (token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setAuth: (user, token) => set({ user, accessToken: token }),
  setAccessToken: (token) => set({ accessToken: token }),
  clearAuth: () => set({ user: null, accessToken: null }),
}))
