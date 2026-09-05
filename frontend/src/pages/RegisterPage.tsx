import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useRegister } from '../hooks/useAuth'
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react'

interface RegisterFormData {
  email: string
  password: string
  full_name: string
}

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormData>()
  const registerMutation = useRegister()

  const password = watch('password', '')
  
  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains a letter', met: /[a-zA-Z]/.test(password) },
  ]

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Create Account</h2>
        <p className="text-gray-600">Start your journey to smarter studying</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Full Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              {...register('full_name', { required: 'Full name is required' })}
              className={`input-field pl-10 ${errors.full_name ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="John Doe"
            />
          </div>
          {errors.full_name && (
            <div className="flex items-center gap-1 text-red-600 text-sm mt-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.full_name.message}</span>
            </div>
          )}
        </div>

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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
              className={`input-field pl-10 ${errors.password ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="Create a strong password"
            />
          </div>
          {errors.password && (
            <div className="flex items-center gap-1 text-red-600 text-sm mt-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.password.message}</span>
            </div>
          )}
          
          {/* Password Requirements */}
          {password && (
            <div className="mt-3 space-y-2">
              {passwordRequirements.map((req) => (
                <div key={req.label} className="flex items-center gap-2 text-sm">
                  {req.met ? (
                    <CheckCircle2 className="w-4 h-4 text-sage-600" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={req.met ? 'text-sage-700' : 'text-gray-500'}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Server Error */}
        {registerMutation.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-card">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">Registration failed</p>
                <p className="text-sm text-red-600">
                  {(registerMutation.error as any)?.response?.data?.detail || 'An error occurred. Please try again.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full btn-primary flex items-center justify-center gap-2 text-base py-3"
        >
          {registerMutation.isPending ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Creating account...
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              Create Account
            </>
          )}
        </button>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center">
          By creating an account, you agree to our{' '}
          <button type="button" className="text-academic-600 hover:text-academic-700 underline">
            Terms of Service
          </button>{' '}
          and{' '}
          <button type="button" className="text-academic-600 hover:text-academic-700 underline">
            Privacy Policy
          </button>
        </p>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">Already have an account?</span>
        </div>
      </div>

      {/* Login Link */}
      <div className="text-center">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-academic-700 hover:text-academic-800 font-semibold"
        >
          Sign in instead
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}
