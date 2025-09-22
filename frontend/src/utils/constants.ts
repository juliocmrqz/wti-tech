/**
 * Application constants for the WTI Tech frontend
 */

export interface Category {
  id: number
  name: string
}

export const POST_CATEGORIES: Category[] = [
  { id: 1, name: 'Technology' },
  { id: 2, name: 'Business' },
  { id: 3, name: 'Lifestyle' },
  { id: 4, name: 'Education' },
  { id: 5, name: 'Entertainment' }
]

// Form validation constants
export const POST_VALIDATION = {
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 200,
  CONTENT_MIN_LENGTH: 10
} as const
