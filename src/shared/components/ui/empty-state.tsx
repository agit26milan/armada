import { memo, type ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

function EmptyStateBase({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      {icon ? (
        <span
          className="mb-1 grid size-11 place-items-center rounded-full bg-accent-soft font-bold text-accent"
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <p className="text-base font-semibold text-ink">{title}</p>
      {description ? (
        <p className="max-w-[42ch] text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

export const EmptyState = memo(EmptyStateBase)

EmptyState.displayName = 'EmptyState'