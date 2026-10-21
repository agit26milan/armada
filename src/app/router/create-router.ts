import { createRouter } from '@tanstack/react-router'

import { routeTree } from '@/routeTree.gen'

import type { RouterContext } from './types'

import type { QueryClient } from '@tanstack/react-query'

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient } satisfies RouterContext,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  })
}

export type AppRouter = ReturnType<typeof createAppRouter>

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter
  }
}
