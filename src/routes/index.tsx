import { createFileRoute } from '@tanstack/react-router'

import { ArmadaPage } from '@/features/armada'

export interface ArmadaSearch {
  page: number
  pageSize: number
  route?: string[]
  trip?: string
}

const DEFAULT_PAGE = 0
const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 100

function parseCount(value: unknown, fallback: number, min: number, max?: number): number {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < min) {
    return fallback
  }

  const normalized = Math.floor(parsed)

  return max === undefined ? normalized : Math.min(normalized, max)
}

function parseText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return ''
}

function parseTextList(value: unknown): string[] | undefined {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
  const items = raw
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)

  return items.length > 0 ? items : undefined
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): ArmadaSearch => ({
    page: parseCount(search.page, DEFAULT_PAGE, 0),
    pageSize: parseCount(search.pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE),
    route: parseTextList(search.route),
    trip: parseText(search.trip) || undefined,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return <ArmadaPage />
}
