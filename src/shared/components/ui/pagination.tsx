import { memo, useCallback, useId, useMemo } from 'react'
import type { ChangeEvent } from 'react'

import { ChevronDownIcon } from '@/shared/components/icons'
import { cn } from '@/shared/lib/cn'
import { formatNumber } from '@/shared/lib/format'

const DEFAULT_PAGE_SIZE_OPTIONS = [6, 12, 24, 48] as const

const BUTTON_BASE =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-semibold whitespace-nowrap transition-colors sm:h-[22px] sm:rounded-md sm:gap-1 sm:px-2.5 sm:text-[11px]'

const BUTTON_SECONDARY =
  'border border-line bg-surface text-ink shadow-card hover:bg-surface-muted disabled:cursor-not-allowed disabled:border-line/70 disabled:text-ink-subtle/60 disabled:shadow-none disabled:hover:bg-surface'

const BUTTON_PRIMARY =
  'border border-transparent bg-brand text-white shadow-card hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-55'

const GLYPH_CLASSES = 'text-[15px] leading-none sm:text-[11px]'

const MAX_PAGE_BUTTONS = 7

type PageItem = number | 'gap'

function buildPageItems(currentPage: number, pageCount: number): PageItem[] {
  if (pageCount <= MAX_PAGE_BUTTONS) {
    return Array.from({ length: pageCount }, (_, index) => index)
  }

  const innerCount = MAX_PAGE_BUTTONS - 2
  const start = Math.max(
    1,
    Math.min(
      currentPage - Math.floor(innerCount / 2),
      pageCount - 1 - innerCount,
    ),
  )
  const end = Math.min(pageCount - 2, start + innerCount - 1)
  const items: PageItem[] = [0]

  if (start > 1) {
    items.push('gap')
  }

  for (let index = start; index <= end; index += 1) {
    items.push(index)
  }

  if (end < pageCount - 2) {
    items.push('gap')
  }

  items.push(pageCount - 1)

  return items
}

export interface PaginationProps {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: readonly number[]
  itemLabel?: string
  isTotalPending?: boolean
  className?: string
}

function PaginationBase({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  itemLabel = 'data',
  isTotalPending = false,
  className,
}: PaginationProps) {
  const selectId = useId()
  const pageJumpId = useId()
  const normalizedPageSize = Math.max(1, Math.floor(pageSize))
  const pageCount = Math.max(1, Math.ceil(totalItems / normalizedPageSize))
  const lastPage = pageCount - 1
  const currentPage = Math.min(Math.max(Math.floor(page), 0), lastPage)
  const firstItem = currentPage * normalizedPageSize + 1
  const lastItem = Math.min((currentPage + 1) * normalizedPageSize, totalItems)

  const sizeOptions = useMemo(() => {
    const unique = new Set([...pageSizeOptions, normalizedPageSize])

    return [...unique].filter((size) => size > 0).sort((left, right) => left - right)
  }, [pageSizeOptions, normalizedPageSize])

  const pageItems = useMemo(
    () => buildPageItems(currentPage, pageCount),
    [currentPage, pageCount],
  )

  const goToPage = useCallback(
    (nextPage: number) => {
      const target = Math.min(Math.max(Math.floor(nextPage), 0), lastPage)

      if (target !== currentPage) {
        onPageChange(target)
      }
    },
    [currentPage, lastPage, onPageChange],
  )

  const handleFirst = useCallback(() => goToPage(0), [goToPage])
  const handleLast = useCallback(() => goToPage(lastPage), [goToPage, lastPage])
  const handleNext = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage])
  const handlePrevious = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage])
  const handlePageSizeChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextPageSize = Number(event.target.value)

      if (Number.isFinite(nextPageSize) && nextPageSize > 0) {
        onPageSizeChange?.(nextPageSize)
      }
    },
    [onPageSizeChange],
  )

  const handlePageJump = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextPage = Number(event.target.value)

      if (Number.isFinite(nextPage)) {
        goToPage(nextPage)
      }
    },
    [goToPage],
  )

  if (totalItems <= 0) {
    return null
  }

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-0 text-[11px] text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:gap-4',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 sm:contents">
        <p aria-live="polite" className="order-1 min-w-0 truncate text-[11px]">
          Showing{' '}
          <span className="font-bold text-ink tabular-nums">
            {formatNumber(firstItem)}–{formatNumber(lastItem)}
          </span>{' '}
          of{' '}
          {isTotalPending ? (
            <span
              aria-label="Loading total"
              className="inline-block h-[11px] w-9 animate-pulse rounded bg-line align-middle"
            />
          ) : (
            <span className="font-bold text-ink tabular-nums">{formatNumber(totalItems)}</span>
          )}{' '}
          {itemLabel}
        </p>

        <p className="order-3 shrink-0 whitespace-nowrap sr-only sm:not-sr-only">
          Page{' '}
          <span className="font-bold text-ink tabular-nums">
            {formatNumber(currentPage + 1)}
          </span>{' '}
          of <span className="font-bold text-ink tabular-nums">{formatNumber(pageCount)}</span>
        </p>
      </div>

      <div className="order-2 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-2">
        {onPageSizeChange ? (
          <div className="flex items-center justify-between gap-2 sm:justify-start">
            <label htmlFor={selectId} className="whitespace-nowrap">
              Rows per page
            </label>
            <div className="relative">
              <select
                id={selectId}
                value={normalizedPageSize}
                onChange={handlePageSizeChange}
                className="h-11 w-[84px] appearance-none rounded-[10px] border border-line bg-surface pr-5 pl-2.5 text-[13px] font-semibold text-ink shadow-card transition-colors hover:bg-surface-muted focus:outline-none sm:h-[22px] sm:w-auto sm:rounded-md sm:pl-2 sm:text-[11px]"
              >
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-1.5 size-2.5 -translate-y-1/2 text-ink-subtle" />
            </div>
          </div>
        ) : null}

        <nav
          aria-label="Pagination"
          className="flex items-center gap-1 sm:gap-1.5"
        >
          <button
            type="button"
            onClick={handleFirst}
            disabled={currentPage === 0}
            aria-label="First page"
            className={cn(BUTTON_BASE, BUTTON_SECONDARY, 'hidden sm:inline-flex')}
          >
            <span aria-hidden="true" className={GLYPH_CLASSES}>
              «
            </span>
            <span>First</span>
          </button>

          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentPage === 0}
            aria-label="Previous page"
            className={cn(BUTTON_BASE, BUTTON_SECONDARY, 'flex-1 sm:flex-none')}
          >
            <span aria-hidden="true" className={GLYPH_CLASSES}>
              ‹
            </span>
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="hidden items-center gap-1 sm:flex sm:gap-1.5">
            {pageItems.map((item, position) =>
              item === 'gap' ? (
                <span
                  key={`gap-${position}`}
                  aria-hidden="true"
                  className="inline-flex h-[22px] min-w-6 items-center justify-center px-1 text-[11px] font-semibold text-ink-subtle"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => goToPage(item)}
                  aria-label={`Page ${item + 1}`}
                  aria-current={item === currentPage ? 'page' : undefined}
                  className={cn(
                    BUTTON_BASE,
                    item === currentPage ? BUTTON_PRIMARY : BUTTON_SECONDARY,
                    'min-w-6 px-2 tabular-nums',
                  )}
                >
                  {formatNumber(item + 1)}
                </button>
              ),
            )}
          </div>

          <div className="relative flex flex-1 items-center sm:hidden">
            <label htmlFor={pageJumpId} className="sr-only">
              Select page
            </label>
            <select
              id={pageJumpId}
              value={currentPage}
              onChange={handlePageJump}
              className="h-11 w-full appearance-none rounded-[10px] border border-line bg-surface pr-6 pl-2.5 text-center text-[13px] font-semibold text-ink tabular-nums shadow-card focus:outline-none"
            >
              {Array.from({ length: pageCount }, (_, index) => (
                <option key={index} value={index}>
                  Page {index + 1} / {pageCount}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2 size-3 text-ink-subtle" />
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentPage === lastPage}
            aria-label="Next page"
            className={cn(BUTTON_BASE, BUTTON_PRIMARY, 'flex-1 sm:flex-none')}
          >
            <span className="hidden sm:inline">Next</span>
            <span aria-hidden="true" className={GLYPH_CLASSES}>
              ›
            </span>
          </button>

          <button
            type="button"
            onClick={handleLast}
            disabled={currentPage === lastPage}
            aria-label="Last page"
            className={cn(BUTTON_BASE, BUTTON_SECONDARY, 'hidden sm:inline-flex')}
          >
            <span>Last</span>
            <span aria-hidden="true" className={GLYPH_CLASSES}>
              »
            </span>
          </button>
        </nav>
      </div>
    </div>
  )
}

export const Pagination = memo(PaginationBase)

Pagination.displayName = 'Pagination'
