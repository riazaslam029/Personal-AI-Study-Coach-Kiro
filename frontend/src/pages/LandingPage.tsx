import { Link } from 'react-router-dom'
import { Brain, Calendar, Target, TrendingUp } from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Study Assistant',
      description: 'Get instant answers and summaries from your study materials using advanced AI.',
    },
    {
      icon: Calendar,
      title: 'Smart Study Planning',
      description: 'Generate personalized study schedules that adapt to your deadlines and workload.',
    },
    {
      icon: Target,
      title: 'Task Prioritization',
      description: 'AI analyzes your tasks and recommends what to focus on next.',
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Visualize your progress and stay motivated with detailed analytics.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-bold text-gray-900">Study Coach</h1>
          <div className="space-x-4">
            <Link
              to="/login"
              className="px-4 py-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Your AI-Powered Study Companion
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Transform your study materials into personalized learning plans, get instant AI assistance,
            and track your progress toward academic success.
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-indigo-600 text-white text-lg rounded-lg hover:bg-indigo-700 font-medium"
          >
            Start Learning Smarter
          </Link>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything You Need to Succeed
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="bg-white p-6 rounded-lg shadow-sm">
              <feature.icon className="text-indigo-600 mb-4" size={32} />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h4>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-indigo-600 rounded-2xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Study Routine?</h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students achieving better results with AI-powered study planning.
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-white text-indigo-600 text-lg rounded-lg hover:bg-gray-100 font-medium"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  )
}
