import { memo, useCallback, useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'

import { CloseIcon } from '@/shared/components/icons'
import { cn } from '@/shared/lib/cn'

const EXIT_DURATION_MS = 220

const SHEET_MEDIA_QUERY = '(max-width: 639px)'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const OVERLAY_CLASSES =
  'fixed inset-0 z-50 flex items-end justify-center overflow-hidden overscroll-contain bg-black/50 backdrop-blur-[2px] transition-opacity duration-200 motion-reduce:transition-none sm:items-center sm:overflow-y-auto sm:p-6'

const PANEL_CLASSES =
  'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-b-0 border-line bg-surface shadow-float transition duration-200 ease-out motion-reduce:transition-none sm:max-h-[calc(100dvh-3rem)] sm:rounded-card sm:border-b'

const HANDLE_CLASSES =
  'flex shrink-0 touch-none justify-center pt-2.5 pb-1.5 select-none sm:hidden'

const HEADER_CLASSES =
  'flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 pb-3.5 sm:py-4'

const BODY_CLASSES =
  'min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:py-5'

const FOOTER_CLASSES =
  'flex shrink-0 flex-col gap-2.5 border-t border-line px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5 sm:py-3.5'

const FOOTER_ACTIONS_CLASSES =
  'flex w-full items-center gap-2.5 [&>*]:flex-1 sm:w-auto sm:justify-end sm:[&>*]:flex-none'

const CLOSE_CLASSES =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-line bg-surface text-ink-muted shadow-card transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:size-9 sm:rounded-control'

const SIZE_CLASSES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-5xl',
} as const

const SHEET_DISMISS_RATIO = 0.25
const SHEET_DISMISS_MIN_DISTANCE = 24
const SHEET_DISMISS_VELOCITY = 0.55

export type ModalSize = keyof typeof SIZE_CLASSES

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  headerActions?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  footerNote?: ReactNode
  size?: ModalSize
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  closeLabel?: string
  ariaLabel?: string
  initialFocusRef?: RefObject<HTMLElement | null>
  dragToDismiss?: boolean
  className?: string
  headerClassName?: string
  bodyClassName?: string
  footerClassName?: string
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const handleChange = () => setMatches(list.matches)

    handleChange()
    list.addEventListener('change', handleChange)

    return () => list.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

function ModalBase({
  open,
  onClose,
  title,
  description,
  headerActions,
  children,
  footer,
  footerNote,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  closeLabel = 'Close',
  ariaLabel,
  initialFocusRef,
  dragToDismiss = true,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
}: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const dragStateRef = useRef<{
    pointerId: number
    startY: number
    startedAt: number
  } | null>(null)
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const isSheet = useMediaQuery(SHEET_MEDIA_QUERY)

  useEffect(() => {
    if (open) {
      setMounted(true)

      const frame = requestAnimationFrame(() => setVisible(true))

      return () => cancelAnimationFrame(frame)
    }

    setVisible(false)
    setDragOffset(0)

    const timer = window.setTimeout(() => setMounted(false), EXIT_DURATION_MS)

    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    const previous = document.activeElement
    previousFocusRef.current = previous instanceof HTMLElement ? previous : null

    const frame = requestAnimationFrame(() => {
      const target = initialFocusRef?.current ?? panelRef.current

      target?.focus()
    })

    return () => {
      cancelAnimationFrame(frame)
      previousFocusRef.current?.focus()
      previousFocusRef.current = null
    }
  }, [initialFocusRef, open])

  useEffect(() => {
    if (!mounted) {
      return
    }

    const { overflow, paddingRight } = document.body.style
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = 'hidden'

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
    }
  }, [mounted])

  useEffect(() => {
    if (!open || !closeOnEscape) {
      return
    }

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => document.removeEventListener('keydown', handleEscape)
  }, [closeOnEscape, onClose, open])

  const handleOverlayPointerDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (closeOnOverlayClick && event.target === event.currentTarget) {
        onClose()
      }
    },
    [closeOnOverlayClick, onClose],
  )

  const handlePanelKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') {
      return
    }

    const panel = panelRef.current

    if (!panel) {
      return
    }

    const focusables = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
      (node) => node.offsetParent !== null,
    )

    if (focusables.length === 0) {
      event.preventDefault()

      return
    }

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement

    if (event.shiftKey && (active === first || !panel.contains(active))) {
      event.preventDefault()
      last.focus()

      return
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }, [])

  const handleDragStart = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!isSheet || !dragToDismiss) {
        return
      }

      if (event.pointerType === 'mouse' && event.button !== 0) {
        return
      }

      dragStateRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startedAt: Date.now(),
      }

      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch (error) {
        if (error instanceof Error && error.name !== "NotFoundError") {
          throw error
        }
      }

      setDragging(true)
    },
    [dragToDismiss, isSheet],
  )

  const handleDragMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current

    if (!state || state.pointerId !== event.pointerId) {
      return
    }

    setDragOffset(Math.max(0, event.clientY - state.startY))
  }, [])

  const handleDragEnd = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const state = dragStateRef.current

      if (!state || state.pointerId !== event.pointerId) {
        return
      }

      dragStateRef.current = null
      setDragging(false)
      setDragOffset(0)

      const distance = Math.max(0, event.clientY - state.startY)
      const elapsed = Math.max(1, Date.now() - state.startedAt)
      const velocity = distance / elapsed
      const height = panelRef.current?.offsetHeight ?? 0
      const passedDistance = distance > height * SHEET_DISMISS_RATIO

      if (
        passedDistance ||
        (distance > SHEET_DISMISS_MIN_DISTANCE && velocity > SHEET_DISMISS_VELOCITY)
      ) {
        onClose()
      }
    },
    [onClose],
  )

  if (!mounted) {
    return null
  }

  const hasHeader = Boolean(title ?? description ?? headerActions) || showCloseButton
  const hasFooter = Boolean(footer ?? footerNote)
  const dragActive = isSheet && dragging

  return createPortal(
    <div
      className={cn(OVERLAY_CLASSES, visible ? 'opacity-100' : 'opacity-0')}
      onPointerDown={handleOverlayPointerDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : ariaLabel}
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        data-state={visible ? 'open' : 'closed'}
        data-variant={isSheet ? 'sheet' : 'dialog'}
        tabIndex={-1}
        onKeyDown={handlePanelKeyDown}
        style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined}
        className={cn(
          PANEL_CLASSES,
          SIZE_CLASSES[size],
          dragActive && 'transition-none',
          visible ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-full sm:translate-y-1 sm:scale-[0.98]',
          'focus-visible:outline-none',
          className,
        )}
      >
        {isSheet ? (
          <div
            className={HANDLE_CLASSES}
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
          >
            <span className="h-1.5 w-11 rounded-full bg-line-strong" aria-hidden="true" />
          </div>
        ) : null}

        {hasHeader ? (
          <div className={cn(HEADER_CLASSES, headerClassName)}>
            <div className="min-w-0 flex-1">
              {title ? (
                <h2 id={titleId} className="text-base leading-tight font-bold text-ink">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p id={descriptionId} className="mt-1.5 text-[12px] text-ink-muted">
                  {description}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {headerActions}
              {showCloseButton ? (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={closeLabel}
                  className={CLOSE_CLASSES}
                >
                  <CloseIcon className="size-4" />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className={cn(BODY_CLASSES, bodyClassName)}>{children}</div>

        {hasFooter ? (
          <div className={cn(FOOTER_CLASSES, footerClassName)}>
            {footerNote ? (
              <div className="min-w-0 text-[11px] text-ink-subtle">{footerNote}</div>
            ) : null}
            {footer ? <div className={FOOTER_ACTIONS_CLASSES}>{footer}</div> : null}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

export const Modal = memo(ModalBase)

Modal.displayName = 'Modal'
