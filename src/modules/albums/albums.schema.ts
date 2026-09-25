import { z } from '@hono/zod-openapi'
import { imageLinks } from '#lib/codecs.js'
import { SongRawSchema, SongSchema, toSong } from '#modules/songs/songs.schema.js'
import { ArtistCreditSchema, emptyableArray, LinkSchema, toArtistCredit } from '#schemas/common.js'

export const AlbumRawSchema = z.object({
  id: z.string(),
  title: z.string(),
  header_desc: z.string().nullable().default(null),
  type: z.string(),
  perma_url: z.string(),
  image: z.string(),
  language: z.string(),
  year: z.string().nullable().default(null),
  play_count: z.string().nullable().default(null),
  explicit_content: z.string(),
  list: emptyableArray(SongRawSchema),
  more_info: z.object({
    song_count: z.string().nullable().default(null),
    artistMap: SongRawSchema.shape.more_info.shape.artistMap
  })
})

export const AlbumSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    type: z.string(),
    year: z.number().nullable(),
    playCount: z.number().nullable(),
    language: z.string(),
    explicitContent: z.boolean(),
    url: z.string(),
    songCount: z.number().nullable(),
    artists: z.object({
      primary: z.array(ArtistCreditSchema),
      featured: z.array(ArtistCreditSchema),
      all: z.array(ArtistCreditSchema)
    }),
    image: z.array(LinkSchema),
    songs: z.array(SongSchema)
  })
  .openapi('Album')

export const toAlbum = (album: z.infer<typeof AlbumRawSchema>): z.infer<typeof AlbumSchema> => ({
  id: album.id,
  name: album.title,
  description: album.header_desc,
  type: album.type,
  year: album.year ? Number(album.year) : null,
  playCount: album.play_count ? Number(album.play_count) : null,
  language: album.language,
  explicitContent: album.explicit_content === '1',
  url: album.perma_url,
  songCount: album.more_info.song_count ? Number(album.more_info.song_count) : null,
  artists: {
    primary: album.more_info.artistMap.primary_artists.map(toArtistCredit),
    featured: album.more_info.artistMap.featured_artists.map(toArtistCredit),
    all: album.more_info.artistMap.artists.map(toArtistCredit)
  },
  image: imageLinks(album.image),
  songs: album.list.map(toSong)
})
