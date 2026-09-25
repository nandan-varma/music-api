import { z } from '@hono/zod-openapi'
import { imageLinks } from '#lib/codecs.js'
import { AlbumRawSchema, AlbumSchema, toAlbum } from '#modules/albums/albums.schema.js'
import { SongRawSchema, SongSchema, toSong } from '#modules/songs/songs.schema.js'
import { LinkSchema } from '#schemas/common.js'

const ArtistBioEntrySchema = z.object({
  text: z.string().nullable(),
  title: z.string().nullable(),
  sequence: z.number().nullable()
})

/** `bio` is a JSON-encoded string when present, but an empty array `[]` when there is none. */
const parseBio = (bio: string | unknown[]): z.infer<typeof ArtistBioEntrySchema>[] | null => {
  if (typeof bio !== 'string' || !bio) return null

  const parsed = ArtistBioEntrySchema.array().safeParse(JSON.parse(bio))
  return parsed.success ? parsed.data : null
}

const SimilarArtistRawSchema = z.object({
  id: z.string(),
  name: z.string(),
  perma_url: z.string(),
  image_url: z.string(),
  languages: z.string().nullable().default(null),
  wiki: z.string().nullable().default(null),
  dob: z.string().nullable().default(null),
  fb: z.string().nullable().default(null),
  twitter: z.string().nullable().default(null),
  isRadioPresent: z.boolean().nullable().default(null),
  type: z.string(),
  dominantType: z.string().nullable().default(null),
  aka: z.string().nullable().default(null),
  bio: z.string().nullable().default(null),
  similar: z.string().nullable().default(null)
})

const SimilarArtistSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    image: z.array(LinkSchema),
    languages: z.record(z.string(), z.string()).nullable(),
    wiki: z.string().nullable(),
    dob: z.string().nullable(),
    fb: z.string().nullable(),
    twitter: z.string().nullable(),
    isRadioPresent: z.boolean().nullable(),
    type: z.string(),
    dominantType: z.string().nullable(),
    aka: z.string().nullable(),
    bio: z.string().nullable(),
    similarArtists: z.array(z.object({ id: z.string(), name: z.string() })).nullable()
  })
  .openapi('SimilarArtist')

const safeJsonParse = (value: string | null): unknown => {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const toSimilarArtist = (artist: z.infer<typeof SimilarArtistRawSchema>): z.infer<typeof SimilarArtistSchema> => ({
  id: artist.id,
  name: artist.name,
  url: artist.perma_url,
  image: imageLinks(artist.image_url),
  languages: z.record(z.string(), z.string()).nullable().catch(null).parse(safeJsonParse(artist.languages)),
  wiki: artist.wiki,
  dob: artist.dob,
  fb: artist.fb,
  twitter: artist.twitter,
  isRadioPresent: artist.isRadioPresent,
  type: artist.type,
  dominantType: artist.dominantType,
  aka: artist.aka,
  bio: artist.bio,
  similarArtists: z
    .array(z.object({ id: z.string(), name: z.string() }))
    .nullable()
    .catch(null)
    .parse(safeJsonParse(artist.similar))
})

export const ArtistRawSchema = z.object({
  artistId: z.string().nullable().optional(),
  id: z.string().optional(),
  name: z.string(),
  image: z.string(),
  follower_count: z.string().nullable().default(null),
  fan_count: z.string().nullable().default(null),
  type: z.string(),
  isVerified: z.boolean().nullable().default(null),
  dominantLanguage: z.string().nullable().default(null),
  dominantType: z.string().nullable().default(null),
  isRadioPresent: z.boolean().nullable().default(null),
  bio: z.union([z.string(), z.array(z.unknown())]).default([]),
  dob: z.string().nullable().default(null),
  fb: z.string().nullable().default(null),
  twitter: z.string().nullable().default(null),
  wiki: z.string().nullable().default(null),
  availableLanguages: z.array(z.string()).default([]),
  topSongs: z.array(SongRawSchema).default([]),
  topAlbums: z.array(AlbumRawSchema).default([]),
  singles: z.array(SongRawSchema).default([]),
  similarArtists: z.array(SimilarArtistRawSchema).default([]),
  urls: z.object({ overview: z.string() }).optional(),
  perma_url: z.string().optional()
})

export const ArtistSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    type: z.string(),
    image: z.array(LinkSchema),
    followerCount: z.number().nullable(),
    fanCount: z.number().nullable(),
    isVerified: z.boolean().nullable(),
    dominantLanguage: z.string().nullable(),
    dominantType: z.string().nullable(),
    bio: z.array(ArtistBioEntrySchema).nullable(),
    dob: z.string().nullable(),
    fb: z.string().nullable(),
    twitter: z.string().nullable(),
    wiki: z.string().nullable(),
    availableLanguages: z.array(z.string()),
    isRadioPresent: z.boolean().nullable(),
    topSongs: z.array(SongSchema),
    topAlbums: z.array(AlbumSchema),
    singles: z.array(SongSchema),
    similarArtists: z.array(SimilarArtistSchema)
  })
  .openapi('Artist')

export const toArtist = (artist: z.infer<typeof ArtistRawSchema>): z.infer<typeof ArtistSchema> => ({
  id: artist.artistId || artist.id || '',
  name: artist.name,
  url: artist.urls?.overview || artist.perma_url || '',
  type: artist.type,
  image: imageLinks(artist.image),
  followerCount: artist.follower_count ? Number(artist.follower_count) : null,
  fanCount: artist.fan_count ? Number(artist.fan_count) : null,
  isVerified: artist.isVerified,
  dominantLanguage: artist.dominantLanguage,
  dominantType: artist.dominantType,
  bio: parseBio(artist.bio),
  dob: artist.dob,
  fb: artist.fb,
  twitter: artist.twitter,
  wiki: artist.wiki,
  availableLanguages: artist.availableLanguages,
  isRadioPresent: artist.isRadioPresent,
  topSongs: artist.topSongs.map(toSong),
  topAlbums: artist.topAlbums.map(toAlbum),
  singles: artist.singles.map(toSong),
  similarArtists: artist.similarArtists.map(toSimilarArtist)
})

export const ArtistAlbumsRawSchema = z.object({
  topAlbums: z.object({
    total: z.number(),
    albums: z.array(AlbumRawSchema).default([])
  })
})

export const ArtistAlbumsSchema = z
  .object({
    total: z.number(),
    albums: z.array(AlbumSchema)
  })
  .openapi('ArtistAlbums')

export const ArtistSongsRawSchema = z.object({
  topSongs: z.object({
    total: z.number(),
    songs: z.array(SongRawSchema).default([])
  })
})

export const ArtistSongsSchema = z
  .object({
    total: z.number(),
    songs: z.array(SongSchema)
  })
  .openapi('ArtistSongs')
