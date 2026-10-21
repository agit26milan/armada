import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api/http-client'
import { isNetworkError } from '@/shared/lib/error-view'

const MAX_RETRIES = 2
const RATE_LIMIT_DELAYS = [4_000, 12_000] as const

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiError) {
            if (error.status === 429) {
              return failureCount < MAX_RETRIES
            }

            if (error.status >= 400 && error.status < 500) {
              return false
            }
          }

          if (isNetworkError(error)) {
            return false
          }

          return failureCount < MAX_RETRIES
        },
        retryDelay: (failureCount, error) => {
          if (error instanceof ApiError && error.status === 429) {
            return (
              error.retryAfterMs ??
              RATE_LIMIT_DELAYS[Math.min(failureCount, RATE_LIMIT_DELAYS.length - 1)]
            )
          }

          return Math.min(1_000 * 2 ** failureCount, 8_000)
        },
      },
      mutations: {
        retry: 0,
      },
    },
  })
}
