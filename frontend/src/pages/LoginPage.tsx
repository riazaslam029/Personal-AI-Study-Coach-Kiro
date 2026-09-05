import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useLogin } from '../hooks/useAuth'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'

interface LoginFormData {
  email: string
  password: string
}

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>()
  const login = useLogin()

  const onSubmit = (data: LoginFormData) => {
    login.mutate(data)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Welcome Back</h2>
        <p className="text-gray-600">Sign in to continue your learning journey</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className={`input-field pl-10 ${errors.email ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="you@university.edu"
            />
          </div>
          {errors.email && (
            <div className="flex items-center gap-1 text-red-600 text-sm mt-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.email.message}</span>
            </div>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <button type="button" className="text-sm text-academic-600 hover:text-academic-700 font-medium">
              Forgot?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              className={`input-field pl-10 ${errors.password ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="Enter your password"
            />
          </div>
          {errors.password && (
            <div className="flex items-center gap-1 text-red-600 text-sm mt-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.password.message}</span>
            </div>
          )}
        </div>

        {/* Server Error */}
        {login.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-card">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">Login failed</p>
                <p className="text-sm text-red-600">
                  {(login.error as any)?.response?.data?.detail || 'Invalid credentials. Please try again.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full btn-primary flex items-center justify-center gap-2 text-base py-3"
        >
          {login.isPending ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Sign In
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">New to Study Coach?</span>
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="text-center">
        <Link 
          to="/register" 
          className="inline-flex items-center gap-2 text-academic-700 hover:text-academic-800 font-semibold"
        >
          Create a free account
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}
