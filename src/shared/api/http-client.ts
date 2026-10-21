import { env } from '@/shared/lib/env'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ApiError'
    this.status = status
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

function buildUrl(path: string, query?: object): string {
  const url = new URL(path, env.apiBaseUrl)

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
    throw new ApiError(`Request failed with status ${response.status}`, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
