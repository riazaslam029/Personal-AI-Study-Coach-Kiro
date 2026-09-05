// Utility functions
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO, isPast } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'No date'
  try {
    const date = parseISO(dateString)
    return format(date, 'MMM d, yyyy')
  } catch {
    return 'Invalid date'
  }
}

export function formatRelativeDate(dateString: string): string {
  try {
    const date = parseISO(dateString)
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

export function isOverdue(deadline: string | null, status: string): boolean {
  if (!deadline || status === 'completed') return false
  try {
    const date = parseISO(deadline)
    return isPast(date)
  } catch {
    return false
  }
}
