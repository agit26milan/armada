import { memo } from 'react'
import { Button } from './button'

export interface ErrorStateProps {
  title?: string
  error?: unknown
  onRetry?: () => void
}

function resolveMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message
  }

  return 'An unexpected error occurred.'
}

function ErrorStateBase({ title = 'Failed to load data', error, onRetry }: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line-strong bg-surface px-6 py-12 text-center"
      role="alert"
    >
      <span
        className="mb-1 grid size-11 place-items-center rounded-full bg-danger-soft font-bold text-danger"
        aria-hidden="true"
      >
        !
      </span>
      <p className="text-base font-semibold text-ink">{title}</p>
      <p className="max-w-[42ch] text-sm text-ink-muted">{resolveMessage(error)}</p>
      {onRetry ? (
        <div className="mt-2">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export const ErrorState = memo(ErrorStateBase)

ErrorState.displayName = 'ErrorState'