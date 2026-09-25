import { HTTPException } from 'hono/http-exception'
import type { z } from 'zod'

/**
 * Parses JioSaavn's response against the shape we actually depend on. JioSaavn's API is undocumented and
 * unversioned, so this is the one place upstream contract drift becomes a clear error instead of silently
 * corrupted data reaching API consumers.
 */
export function parseUpstream<Schema extends z.ZodType>(
  schema: Schema,
  data: unknown,
  resource: string
): z.infer<Schema> {
  const result = schema.safeParse(data)

  if (!result.success) {
    const detail = result.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`).join('; ')
    console.error(`[validate] ✗ ${resource} failed schema validation: ${detail}`)
    console.error(`[validate]   raw payload for ${resource}:`, JSON.stringify(data).slice(0, 2000))
    throw new HTTPException(502, {
      message: `unexpected response shape from JioSaavn for ${resource}: ${detail}`
    })
  }

  return result.data
}
