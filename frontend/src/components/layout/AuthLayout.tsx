import { Outlet } from 'react-router-dom'
import { GraduationCap, Sparkles, CheckCircle2, BookOpen, Target, TrendingUp } from 'lucide-react'

export default function AuthLayout() {
  const features = [
    'AI-powered study assistance',
    'Smart task prioritization',
    'Personalized study plans',
    'Progress tracking & analytics',
  ]

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-academic-800 to-academic-700 p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white opacity-5"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full bg-white opacity-5"></div>
        
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Study Coach</span>
          </div>

          {/* Headline */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-6 border border-white/20">
              <Sparkles className="w-4 h-4" />
              AI-Powered Learning Platform
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Transform Your Study Routine with AI
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              Join students who are achieving better results with intelligent study planning, 
              personalized task recommendations, and AI-powered learning assistance.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-4">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-sage-500/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-sage-400/30">
                  <CheckCircle2 className="w-4 h-4 text-sage-300" />
                </div>
                <span className="text-white/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="relative z-10 flex gap-8 pt-8 border-t border-white/10">
          <div>
            <div className="text-2xl font-bold mb-1">10,000+</div>
            <div className="text-sm text-white/70">Study Sessions</div>
          </div>
          <div>
            <div className="text-2xl font-bold mb-1">500+</div>
            <div className="text-sm text-white/70">Active Students</div>
          </div>
          <div>
            <div className="text-2xl font-bold mb-1">95%</div>
            <div className="text-sm text-white/70">Satisfaction</div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-academic-800 to-academic-700 flex items-center justify-center shadow-sm">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-academic-900 tracking-tight">Study Coach</span>
            </div>
            <p className="text-gray-600 text-sm">AI-powered study planning</p>
          </div>

          {/* Form Container */}
          <div className="card p-8 lg:p-10 shadow-elevated">
            <Outlet />
          </div>

          {/* Footer Text */}
          <p className="text-center text-sm text-gray-500 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
