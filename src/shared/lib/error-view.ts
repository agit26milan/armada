import { ApiError } from '@/shared/api/http-client'

export interface ErrorView {
  title: string
  description: string
  canRetry: boolean
}

const NETWORK_ERROR_PATTERN = /fetch|network|load failed|connection/i

export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true
  }

  return error instanceof TypeError && NETWORK_ERROR_PATTERN.test(error.message)
}

export function isRateLimitError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 429
}

export function formatRetryDelay(milliseconds?: number): number | null {
  if (milliseconds === undefined || !Number.isFinite(milliseconds)) {
    return null
  }

  return Math.max(1, Math.ceil(milliseconds / 1000))
}

export function getErrorView(error: unknown, subject: string): ErrorView {
  if (isNetworkError(error)) {
    return {
      title: 'No internet connection',
      description: `We couldn't reach the MBTA API. Check your connection, then try again.`,
      canRetry: true,
    }
  }

  if (error instanceof ApiError) {
    if (error.status === 429) {
      const seconds = formatRetryDelay(error.retryAfterMs)

      return {
        title: 'Too many requests',
        description:
          seconds === null
            ? 'The MBTA API allows about 20 requests per minute. Wait a moment, then try again.'
            : `The MBTA API allows about 20 requests per minute. Wait ${seconds} seconds, then try again.`,
        canRetry: true,
      }
    }

    if (error.status === 404) {
      return {
        title: 'Not found',
        description: `The requested ${subject} is no longer available from the MBTA API.`,
        canRetry: false,
      }
    }

    if (error.status >= 500) {
      return {
        title: 'MBTA service is having trouble',
        description: `The MBTA API returned an error while loading ${subject}. Try again in a moment.`,
        canRetry: true,
      }
    }

    return {
      title: `Failed to load ${subject}`,
      description: `The MBTA API rejected the request (status ${error.status}). Try different filters.`,
      canRetry: false,
    }
  }

  return {
    title: `Failed to load ${subject}`,
    description: 'Something went wrong while talking to the MBTA API. Try again in a moment.',
    canRetry: true,
  }
}
