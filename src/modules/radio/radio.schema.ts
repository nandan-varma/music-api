import { z } from '@hono/zod-openapi'

/**
 * JioSaavn exposes no endpoint that lists valid featured-station names — they're only discoverable
 * from the web/app UI. This is a hand-curated set of names known to work, kept here so every
 * consumer of this API shares one list instead of guessing independently. A station may currently
 * have nothing queued (see `getFeaturedRadio`), which is expected, not an error.
 */
export const FEATURED_STATIONS = [
  { name: 'Bollywood Butter', language: 'hindi', label: 'Bollywood Butter' },
  { name: '90s Love', language: 'hindi', label: '90s Love' },
  { name: 'Old Is Gold', language: 'hindi', label: 'Old Is Gold' },
  { name: 'Workout', language: 'english', label: 'Workout' },
  { name: 'Romance', language: 'english', label: 'Romance' },
  { name: 'Chill Hits', language: 'english', label: 'Chill Hits' },
  { name: 'Party Anthems', language: 'english', label: 'Party Anthems' },
  { name: 'Indie Mixtape', language: 'english', label: 'Indie Mixtape' }
] as const satisfies readonly { name: string; language: string; label: string }[]

export const StationSchema = z
  .object({
    name: z.string().openapi({ description: 'Station name to pass as `name` to GET /radio/featured' }),
    language: z.string().openapi({ description: 'Station content language, e.g. "hindi"' }),
    label: z.string().openapi({ description: 'Human-readable display name for this station' })
  })
  .openapi('Station')
