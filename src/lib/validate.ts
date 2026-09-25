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
    throw new HTTPException(502, {
      message: `unexpected response shape from JioSaavn for ${resource}: ${result.error.issues
        .map((issue) => `${issue.path.join('.')} ${issue.message}`)
        .join('; ')}`
    })
  }

  return result.data
}
