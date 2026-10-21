import { createRootRouteWithContext } from '@tanstack/react-router'

import { RootLayout } from '@/app/layouts/root-layout'
import { ErrorState } from '@/shared/components/ui/error-state'
import { EmptyState } from '@/shared/components/ui/empty-state'

import type { RouterContext } from '@/app/router/types'
import type { ErrorComponentProps } from '@tanstack/react-router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundRoute,
  errorComponent: RootError,
})

function NotFoundRoute() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you opened is not available. Return to the home page to continue."
    />
  )
}

function RootError({ error, reset }: ErrorComponentProps) {
  return <ErrorState error={error} onRetry={reset} />
}
