// React Query key constants
export const queryKeys = {
  courses: {
    all: ['courses'] as const,
    detail: (id: string) => ['courses', id] as const,
    stats: (id: string) => ['courses', id, 'stats'] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    detail: (id: string) => ['tasks', id] as const,
  },
  materials: {
    all: ['materials'] as const,
    detail: (id: string) => ['materials', id] as const,
  },
  plan: {
    current: ['plan'] as const,
    today: ['plan', 'today'] as const,
  },
  ai: {
    prioritization: ['ai', 'prioritization'] as const,
  },
}
