import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { env } from '@/shared/lib/env'

import type { AppRouter } from '../router/create-router'

import type { QueryClient } from '@tanstack/react-query'

interface AppProvidersProps {
  queryClient: QueryClient
  router: AppRouter
}

export function AppProviders({ queryClient, router }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />

      {env.isDev ? (
        <>
          <ReactQueryDevtools buttonPosition="bottom-left" />
          <TanStackRouterDevtools router={router} position="bottom-right" />
        </>
      ) : null}
    </QueryClientProvider>
  )
}
