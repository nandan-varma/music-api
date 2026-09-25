import { z } from '@hono/zod-openapi'
import { imageLinks } from '#lib/codecs'

/**
 * JioSaavn represents an empty list as `""` instead of `[]` in several places (e.g. an album/playlist's `list`
 * field on a not-found response). This normalizes either shape to an array before validating its items.
 */
export const emptyableArray = <T extends z.ZodType>(item: T) =>
  z.preprocess((value) => (typeof value === 'string' ? [] : value), z.array(item).default([]))

export const LinkSchema = z
  .object({
    quality: z.string().openapi({ description: 'Quality label, e.g. "320kbps" or "500x500"', example: '320kbps' }),
    url: z.string().openapi({ description: 'Direct URL for this quality', example: 'https://aac.saavncdn.com/...' })
  })
  .openapi('Link')

/** How an artist is credited against a song, album, or playlist — distinct from the full `Artist` resource. */
export const ArtistCreditRawSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  type: z.string(),
  image: z.string(),
  perma_url: z.string()
})

export const ArtistCreditSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    type: z.string(),
    image: z.array(LinkSchema),
    url: z.string()
  })
  .openapi('ArtistCredit')

export const toArtistCredit = (artist: z.infer<typeof ArtistCreditRawSchema>): z.infer<typeof ArtistCreditSchema> => ({
  id: artist.id,
  name: artist.name,
  role: artist.role,
  type: artist.type,
  image: imageLinks(artist.image),
  url: artist.perma_url
})
