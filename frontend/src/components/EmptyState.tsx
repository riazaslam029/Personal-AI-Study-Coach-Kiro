import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  illustration?: 'tasks' | 'materials' | 'planner' | 'progress'
}

export default function EmptyState({ icon: Icon, title, description, action, illustration }: EmptyStateProps) {
  return (
    <div className="card p-12 text-center">
      {/* Illustration Background */}
      <div className="relative mb-6">
        {/* Decorative circles */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-academic-100 to-sage-100 opacity-30 animate-pulse"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-academic-100 opacity-20 animate-pulse delay-75"></div>
        </div>
        
        {/* Main icon */}
        <div className="relative w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-academic-100 to-academic-50 flex items-center justify-center shadow-sm">
          <Icon className="w-10 h-10 text-academic-600" strokeWidth={1.5} />
        </div>
      </div>

      {/* Friendly SVG Illustration */}
      {illustration && <IllustrationSVG type={illustration} />}

      {/* Content */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">{description}</p>

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary inline-flex items-center gap-2 mx-auto"
        >
          {action.label}
        </button>
      )}

      {/* Subtle hint */}
      <p className="text-xs text-gray-400 mt-6">
        💡 Tip: Start small and build momentum!
      </p>
    </div>
  )
}

// Subtle SVG Illustrations
function IllustrationSVG({ type }: { type: string }) {
  if (type === 'tasks') {
    return (
      <svg className="w-48 h-32 mx-auto mb-6 opacity-40" viewBox="0 0 200 120" fill="none">
        {/* Checkboxes */}
        <rect x="40" y="20" width="20" height="20" rx="4" stroke="#1E293B" strokeWidth="2" fill="none" />
        <rect x="40" y="50" width="20" height="20" rx="4" stroke="#1E293B" strokeWidth="2" fill="none" />
        <rect x="40" y="80" width="20" height="20" rx="4" stroke="#1E293B" strokeWidth="2" fill="none" />
        
        {/* Lines */}
        <line x1="70" y1="30" x2="160" y2="30" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <line x1="70" y1="60" x2="140" y2="60" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <line x1="70" y1="90" x2="150" y2="90" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        
        {/* Decorative elements */}
        <circle cx="180" cy="25" r="4" fill="#F59E0B" opacity="0.6" />
        <circle cx="170" cy="95" r="3" fill="#16A34A" opacity="0.6" />
      </svg>
    )
  }

  if (type === 'materials') {
    return (
      <svg className="w-48 h-32 mx-auto mb-6 opacity-40" viewBox="0 0 200 120" fill="none">
        {/* Document stack */}
        <rect x="50" y="35" width="70" height="90" rx="4" fill="#F1F5F9" stroke="#1E293B" strokeWidth="2" />
        <rect x="60" y="25" width="70" height="90" rx="4" fill="#E2E8F0" stroke="#1E293B" strokeWidth="2" />
        <rect x="70" y="15" width="70" height="90" rx="4" fill="white" stroke="#1E293B" strokeWidth="2" />
        
        {/* Document lines */}
        <line x1="85" y1="35" x2="125" y2="35" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <line x1="85" y1="50" x2="120" y2="50" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <line x1="85" y1="65" x2="115" y2="65" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        
        {/* Plus icon */}
        <circle cx="150" cy="80" r="15" fill="#3B82F6" opacity="0.2" />
        <line x1="150" y1="72" x2="150" y2="88" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
        <line x1="142" y1="80" x2="158" y2="80" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'planner') {
    return (
      <svg className="w-48 h-32 mx-auto mb-6 opacity-40" viewBox="0 0 200 120" fill="none">
        {/* Calendar grid */}
        <rect x="50" y="20" width="100" height="80" rx="6" fill="white" stroke="#1E293B" strokeWidth="2" />
        <rect x="50" y="20" width="100" height="20" rx="6" fill="#1E293B" />
        
        {/* Calendar dots */}
        <circle cx="70" cy="55" r="3" fill="#94A3B8" />
        <circle cx="85" cy="55" r="3" fill="#94A3B8" />
        <circle cx="100" cy="55" r="3" fill="#3B82F6" />
        <circle cx="115" cy="55" r="3" fill="#94A3B8" />
        <circle cx="130" cy="55" r="3" fill="#94A3B8" />
        
        <circle cx="70" cy="75" r="3" fill="#94A3B8" />
        <circle cx="85" cy="75" r="3" fill="#F59E0B" />
        <circle cx="100" cy="75" r="3" fill="#94A3B8" />
        <circle cx="115" cy="75" r="3" fill="#16A34A" />
        
        {/* Sparkle */}
        <path d="M160 40 L162 46 L168 48 L162 50 L160 56 L158 50 L152 48 L158 46 Z" fill="#F59E0B" opacity="0.6" />
      </svg>
    )
  }

  if (type === 'progress') {
    return (
      <svg className="w-48 h-32 mx-auto mb-6 opacity-40" viewBox="0 0 200 120" fill="none">
        {/* Progress bars */}
        <rect x="40" y="30" width="120" height="12" rx="6" fill="#F1F5F9" />
        <rect x="40" y="30" width="60" height="12" rx="6" fill="#3B82F6" opacity="0.6" />
        
        <rect x="40" y="55" width="120" height="12" rx="6" fill="#F1F5F9" />
        <rect x="40" y="55" width="90" height="12" rx="6" fill="#16A34A" opacity="0.6" />
        
        <rect x="40" y="80" width="120" height="12" rx="6" fill="#F1F5F9" />
        <rect x="40" y="80" width="40" height="12" rx="6" fill="#F59E0B" opacity="0.6" />
        
        {/* Trophy */}
        <circle cx="175" cy="55" r="12" fill="#F59E0B" opacity="0.3" />
        <path d="M175 48 L178 55 L175 62 L172 55 Z" fill="#F59E0B" opacity="0.6" />
      </svg>
    )
  }

  return null
}
