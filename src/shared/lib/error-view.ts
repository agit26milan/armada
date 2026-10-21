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

const DEFAULT_RATE_LIMIT_COOLDOWN_MS = 15_000

export function getRateLimitCooldownMs(error: unknown): number | null {
  if (!(error instanceof ApiError) || error.status !== 429) {
    return null
  }

  return error.retryAfterMs ?? DEFAULT_RATE_LIMIT_COOLDOWN_MS
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
      return {
        title: 'Too many requests',
        description:
          'The MBTA API allows about 20 requests per minute. Try again once the countdown finishes.',
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
