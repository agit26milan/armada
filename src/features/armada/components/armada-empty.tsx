import { EmptyState } from "@/shared/components/ui/empty-state"
import React from "react"

const ArmadaEmpty = () => {
  return (
    <EmptyState title="No vehicles are currently in service." />
  )
}

export default React.memo(ArmadaEmpty)