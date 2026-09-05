import { Link } from 'react-router-dom'
import { Brain, Calendar, Target, TrendingUp, GraduationCap, BookOpen, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: Brain,
      title: 'AI Study Assistant',
      description: 'Ask questions, get summaries, and generate quizzes from your study materials with advanced AI.',
      color: 'academic',
    },
    {
      icon: Calendar,
      title: 'Smart Study Plans',
      description: 'AI-generated schedules that adapt to your deadlines, workload, and learning pace.',
      color: 'forest',
    },
    {
      icon: Target,
      title: 'Task Prioritization',
      description: 'Intelligent recommendations on what to study next based on deadlines and difficulty.',
      color: 'amber',
    },
    {
      icon: TrendingUp,
      title: 'Progress Analytics',
      description: 'Visual insights into your study habits, completion rates, and academic momentum.',
      color: 'sage',
    },
  ]

  const benefits = [
    'Upload PDFs and paste notes instantly',
    'AI-generated study schedules',
    'Personalized task recommendations',
    'Progress tracking and analytics',
  ]

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-academic-800 to-academic-700 flex items-center justify-center shadow-sm">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-academic-900 tracking-tight">Study Coach</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="btn-secondary"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="btn-primary flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container mx-auto px-4 py-20 lg:py-28">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-academic-100 to-sage-100 text-academic-800 text-sm font-medium mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 text-academic-600" />
            AI-Powered Study Platform for Students
          </div>

          {/* Headline */}
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
            Study Smarter with
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-academic-800 to-forest-700">
              AI-Powered Learning
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Transform your study materials into personalized learning plans. Get instant AI assistance, 
            intelligent task prioritization, and track your academic progress—all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              to="/register"
              className="btn-primary text-lg px-8 py-4 shadow-md hover:shadow-lg transition-shadow flex items-center gap-2"
            >
              <GraduationCap className="w-5 h-5" />
              Start Learning Smarter
            </Link>
            <Link
              to="/login"
              className="btn-secondary text-lg px-8 py-4 flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              I Have an Account
            </Link>
          </div>

          {/* Quick Benefits */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sage-600" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="bg-white py-20 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful tools designed specifically for university students to organize, learn, and excel.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const colorClasses = {
                academic: 'from-academic-100 to-academic-50 text-academic-600',
                forest: 'from-forest-100 to-forest-50 text-forest-600',
                amber: 'from-amber-100 to-amber-50 text-amber-600',
                sage: 'from-sage-100 to-sage-50 text-sage-600',
              }[feature.color]

              return (
                <div key={feature.title} className="card p-6 hover:shadow-card-hover transition-shadow group">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="card p-12 text-center shadow-elevated bg-gradient-to-br from-academic-50 to-white border-2 border-academic-100">
          <div className="flex justify-center gap-12 mb-8 flex-wrap">
            <div>
              <div className="text-4xl font-bold text-academic-800 mb-1">10,000+</div>
              <div className="text-gray-600">Study Sessions</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-forest-700 mb-1">500+</div>
              <div className="text-gray-600">Active Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-amber-600 mb-1">95%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Join students who are transforming their study routines with AI-powered organization and personalized learning plans.
          </p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="rounded-2xl bg-gradient-to-br from-academic-800 to-academic-700 p-12 lg:p-16 text-center text-white shadow-elevated">
          <h2 className="text-4xl font-bold mb-4 tracking-tight">
            Ready to Transform Your Study Routine?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
            Create your free account and start building better study habits today. No credit card required.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-academic-800 text-lg rounded-card hover:bg-cream-50 font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <GraduationCap className="w-5 h-5" />
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>&copy; 2026 Study Coach. Built with AI to help students succeed.</p>
        </div>
      </footer>
    </div>
  )
}
