import { env } from '@/shared/lib/env'

export class ApiError extends Error {
  readonly status: number
  readonly retryAfterMs?: number

  constructor(message: string, status: number, retryAfterMs?: number, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ApiError'
    this.status = status
    this.retryAfterMs = retryAfterMs
  }
}

type QueryValue = string | number | boolean | null | undefined

export type QueryParams = Record<string, QueryValue>

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  query?: object
}

function isQueryScalar(value: unknown): value is QueryValue {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

function joinPath(base: string, path: string): string {
  const baseUrl = base.endsWith('/') ? base : `${base}/`
  const relative = path.startsWith('/') ? path.slice(1) : path

  return new URL(relative, baseUrl).toString()
}

function buildUrl(path: string, query?: object): string {
  const url = new URL(joinPath(env.apiBaseUrl, path))

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') {
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (isQueryScalar(item) && item !== undefined && item !== null && item !== '') {
          url.searchParams.append(key, String(item))
        }
      }

      continue
    }

    if (!isQueryScalar(value)) {
      throw new TypeError(`Query value "${key}" must be a scalar, not ${typeof value}`)
    }

    url.searchParams.set(key, String(value))
  }

  return url.toString()
}

function parseRetryAfter(value: string | null): number | undefined {
  if (value === null || value.trim() === '') {
    return undefined
  }

  const seconds = Number(value)

  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1000)
  }

  const date = Date.parse(value)

  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : undefined
}

export async function httpRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, headers, ...init } = options

  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      parseRetryAfter(response.headers.get('Retry-After')),
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
