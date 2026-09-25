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
  const start = Date.now()
  console.info(`[jiosaavn] → ${call}`, params)

  let response: Response
  try {
    response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', 'User-Agent': userAgent }
    })
  } catch (error) {
    console.error(`[jiosaavn] ✗ ${call} network error after ${Date.now() - start}ms:`, error)
    throw error
  }

  const elapsed = Date.now() - start
  const text = await response.text()

  let data: T
  try {
    data = JSON.parse(text) as T
  } catch {
    console.error(
      `[jiosaavn] ✗ ${call} returned non-JSON after ${elapsed}ms (status ${response.status}):`,
      text.slice(0, 500)
    )
    throw new Error(`jiosaavn upstream returned non-JSON for ${call} (status ${response.status})`)
  }

  if (!response.ok) {
    console.error(`[jiosaavn] ✗ ${call} status ${response.status} after ${elapsed}ms`, params)
  } else {
    console.info(`[jiosaavn] ← ${call} ${response.status} in ${elapsed}ms`)
  }

  return { data, ok: response.ok }
}
