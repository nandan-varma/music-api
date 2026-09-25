import { USER_AGENTS, type JioSaavnContext } from './constants.js'

const JIOSAAVN_API_URL = 'https://www.jiosaavn.com/api.php'

interface JioSaavnRequest {
  call: string
  params?: Record<string, string | number>
  context?: JioSaavnContext
}

export interface JioSaavnResponse<T> {
  data: T
  ok: boolean
}

/** Calls JioSaavn's private `api.php`. Not typed by JioSaavn — callers validate the JSON shape themselves. */
export async function fetchJioSaavn<T>({
  call,
  params = {},
  context = 'web6dot0'
}: JioSaavnRequest): Promise<JioSaavnResponse<T>> {
  const url = new URL(JIOSAAVN_API_URL)

  url.searchParams.set('__call', call)
  url.searchParams.set('_format', 'json')
  url.searchParams.set('_marker', '0')
  url.searchParams.set('api_version', '4')
  url.searchParams.set('ctx', context)

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }

  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', 'User-Agent': userAgent }
  })

  return { data: (await response.json()) as T, ok: response.ok }
}
