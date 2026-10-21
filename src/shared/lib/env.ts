const DEFAULT_API_BASE_URL = 'https://api-v3.mbta.com'

function resolveApiBaseUrl(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? ''

  if (trimmed === '') {
    return DEFAULT_API_BASE_URL
  }

  try {
    const url = new URL(trimmed)

    return url.toString().replace(/\/+$/, '')
  } catch {
    console.warn(
      `[env] VITE_API_BASE_URL is not a valid absolute URL ("${trimmed}"). Falling back to ${DEFAULT_API_BASE_URL}.`,
    )

    return DEFAULT_API_BASE_URL
  }
}

export const env = {
  apiBaseUrl: resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  isDev: import.meta.env.DEV,
} as const
