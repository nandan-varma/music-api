import { z } from '@hono/zod-openapi'
import { imageLinks } from '#lib/codecs'
import { SongRawSchema, SongSchema, toSong } from '#modules/songs/songs.schema'
import { ArtistCreditRawSchema, ArtistCreditSchema, emptyableArray, LinkSchema, toArtistCredit } from '#schemas/common'

export const PlaylistRawSchema = z.object({
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
  list_count: z.string().nullable().default(null),
  list: emptyableArray(SongRawSchema),
  more_info: z.object({
    artists: emptyableArray(ArtistCreditRawSchema)
  })
})

export const PlaylistSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    type: z.string(),
    year: z.number().nullable(),
    playCount: z.number().nullable(),
    language: z.string(),
    explicitContent: z.boolean(),
    songCount: z.number().nullable(),
    url: z.string(),
    image: z.array(LinkSchema),
    songs: z.array(SongSchema),
    artists: z.array(ArtistCreditSchema)
  })
  .openapi('Playlist')

export const toPlaylist = (playlist: z.infer<typeof PlaylistRawSchema>): z.infer<typeof PlaylistSchema> => ({
  id: playlist.id,
  name: playlist.title,
  description: playlist.header_desc,
  type: playlist.type,
  year: playlist.year ? Number(playlist.year) : null,
  playCount: playlist.play_count ? Number(playlist.play_count) : null,
  language: playlist.language,
  explicitContent: playlist.explicit_content === '1',
  songCount: playlist.list_count ? Number(playlist.list_count) : null,
  url: playlist.perma_url,
  image: imageLinks(playlist.image),
  songs: playlist.list.map(toSong),
  artists: playlist.more_info.artists.map(toArtistCredit)
})
