import { EmptyState } from "@/shared/components/ui/empty-state"
import React from "react"

interface ArmadaEmptyProps {
  hasFilters?: boolean
  onClearFilters?: () => void
}

const ArmadaEmpty = ({ hasFilters = false, onClearFilters }: ArmadaEmptyProps) => {
  if (hasFilters) {
    return (
      <EmptyState
        title="No vehicles match these filters."
        description="Try a different route or trip, or clear the filters to see every vehicle currently in service."
        action={
          onClearFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11.5px] font-semibold text-ink transition-colors hover:bg-surface-muted dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              Clear filters
            </button>
          ) : null
        }
      />
    )
  }

  return (
    <EmptyState title="No vehicles are currently in service." />
  )
}

export default React.memo(ArmadaEmpty)
