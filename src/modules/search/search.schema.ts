import { z } from '@hono/zod-openapi'
import { imageLinks } from '#lib/codecs'
import { SongRawSchema, SongSchema } from '#modules/songs/songs.schema'
import { ArtistCreditRawSchema, ArtistCreditSchema, LinkSchema, toArtistCredit } from '#schemas/common'

const searchSection = <T extends z.ZodType>(item: T) => z.object({ results: z.array(item), position: z.number() })

const QuickResultSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    image: z.array(LinkSchema),
    album: z.string().nullable(),
    url: z.string(),
    type: z.string(),
    language: z.string(),
    description: z.string(),
    primaryArtists: z.string(),
    singers: z.string()
  })
  .openapi('QuickSearchResult')

/**
 * "Quick" results (top query + the songs/playlists sections) are usually song/album/playlist-shaped, but
 * `topquery` can also surface a bare artist match — which has neither `perma_url` nor `more_info`. Every field
 * that only the song/album/playlist shape carries is therefore optional here.
 */
const QuickResultRawSchema = z.object({
  id: z.string(),
  title: z.string(),
  image: z.string(),
  perma_url: z.string().optional(),
  type: z.string(),
  description: z.string().nullable().default(null),
  more_info: z
    .object({
      album: z.string().nullable().default(null),
      language: z.string().nullable().default(null),
      primary_artists: z.string().nullable().default(null),
      singers: z.string().nullable().default(null)
    })
    .optional()
})

const toQuickResult = (item: z.infer<typeof QuickResultRawSchema>): z.infer<typeof QuickResultSchema> => ({
  id: item.id,
  title: item.title,
  image: imageLinks(item.image),
  album: item.more_info?.album ?? null,
  url: item.perma_url ?? '',
  type: item.type,
  language: item.more_info?.language ?? '',
  description: item.description ?? '',
  primaryArtists: item.more_info?.primary_artists ?? '',
  singers: item.more_info?.singers ?? ''
})

const QuickAlbumRawSchema = z.object({
  id: z.string(),
  title: z.string(),
  image: z.string(),
  perma_url: z.string(),
  type: z.string(),
  description: z.string().nullable().default(null),
  more_info: z.object({
    music: z.string().nullable().default(null),
    year: z.string().nullable().default(null),
    song_pids: z.string().nullable().default(null),
    language: z.string()
  })
})

const QuickAlbumSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    image: z.array(LinkSchema),
    artist: z.string().nullable(),
    url: z.string(),
    type: z.string(),
    description: z.string(),
    year: z.string().nullable(),
    language: z.string(),
    songIds: z.string().nullable()
  })
  .openapi('QuickSearchAlbum')

const toQuickAlbum = (album: z.infer<typeof QuickAlbumRawSchema>): z.infer<typeof QuickAlbumSchema> => ({
  id: album.id,
  title: album.title,
  image: imageLinks(album.image),
  artist: album.more_info.music,
  url: album.perma_url,
  type: album.type,
  description: album.description ?? '',
  year: album.more_info.year,
  language: album.more_info.language,
  songIds: album.more_info.song_pids
})

const QuickArtistRawSchema = z.object({
  id: z.string(),
  title: z.string(),
  image: z.string(),
  type: z.string(),
  description: z.string().nullable().default(null),
  position: z.number()
})

const QuickArtistSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    image: z.array(LinkSchema),
    type: z.string(),
    description: z.string(),
    position: z.number()
  })
  .openapi('QuickSearchArtist')

const toQuickArtist = (artist: z.infer<typeof QuickArtistRawSchema>): z.infer<typeof QuickArtistSchema> => ({
  id: artist.id,
  title: artist.title,
  image: imageLinks(artist.image),
  type: artist.type,
  description: artist.description ?? '',
  position: artist.position
})

export const SearchAllRawSchema = z.object({
  topquery: z.object({ data: z.array(QuickResultRawSchema).default([]), position: z.number() }),
  songs: z.object({ data: z.array(QuickResultRawSchema).default([]), position: z.number() }),
  albums: z.object({ data: z.array(QuickAlbumRawSchema).default([]), position: z.number() }),
  artists: z.object({ data: z.array(QuickArtistRawSchema).default([]), position: z.number() }),
  playlists: z.object({ data: z.array(QuickResultRawSchema).default([]), position: z.number() })
})

export const SearchAllSchema = z
  .object({
    topQuery: searchSection(QuickResultSchema),
    songs: searchSection(QuickResultSchema),
    albums: searchSection(QuickAlbumSchema),
    artists: searchSection(QuickArtistSchema),
    playlists: searchSection(QuickResultSchema)
  })
  .openapi('SearchAll')

export const toSearchAll = (search: z.infer<typeof SearchAllRawSchema>): z.infer<typeof SearchAllSchema> => ({
  topQuery: { results: search.topquery.data.map(toQuickResult), position: search.topquery.position },
  songs: { results: search.songs.data.map(toQuickResult), position: search.songs.position },
  albums: { results: search.albums.data.map(toQuickAlbum), position: search.albums.position },
  artists: { results: search.artists.data.map(toQuickArtist), position: search.artists.position },
  playlists: { results: search.playlists.data.map(toQuickResult), position: search.playlists.position }
})

const paginated = <T extends z.ZodType>(item: T) =>
  z.object({ total: z.number(), start: z.number(), results: z.array(item) })

export const SearchSongsRawSchema = paginated(SongRawSchema)
export const SearchSongsSchema = paginated(SongSchema).openapi('SearchSongs')

const SearchAlbumRawSchema = z.object({
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
  more_info: z.object({ artistMap: SongRawSchema.shape.more_info.shape.artistMap })
})

const SearchAlbumSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    year: z.number().nullable(),
    type: z.string(),
    playCount: z.number().nullable(),
    language: z.string(),
    explicitContent: z.boolean(),
    artists: z.object({
      primary: z.array(ArtistCreditSchema),
      featured: z.array(ArtistCreditSchema),
      all: z.array(ArtistCreditSchema)
    }),
    url: z.string(),
    image: z.array(LinkSchema)
  })
  .openapi('SearchAlbum')

const toSearchAlbum = (album: z.infer<typeof SearchAlbumRawSchema>): z.infer<typeof SearchAlbumSchema> => ({
  id: album.id,
  name: album.title,
  description: album.header_desc,
  year: album.year ? Number(album.year) : null,
  type: album.type,
  playCount: album.play_count ? Number(album.play_count) : null,
  language: album.language,
  explicitContent: album.explicit_content === '1',
  artists: {
    primary: album.more_info.artistMap.primary_artists.map(toArtistCredit),
    featured: album.more_info.artistMap.featured_artists.map(toArtistCredit),
    all: album.more_info.artistMap.artists.map(toArtistCredit)
  },
  url: album.perma_url,
  image: imageLinks(album.image)
})

export const SearchAlbumsRawSchema = paginated(SearchAlbumRawSchema)
export const SearchAlbumsSchema = paginated(SearchAlbumSchema).openapi('SearchAlbums')
export { toSearchAlbum }

export const SearchArtistsRawSchema = paginated(ArtistCreditRawSchema)
export const SearchArtistsSchema = paginated(ArtistCreditSchema).openapi('SearchArtists')

const SearchPlaylistRawSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  image: z.string(),
  perma_url: z.string(),
  explicit_content: z.string(),
  more_info: z.object({
    song_count: z.string().nullable().default(null),
    language: z.string()
  })
})

const SearchPlaylistSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    image: z.array(LinkSchema),
    url: z.string(),
    songCount: z.number().nullable(),
    language: z.string(),
    explicitContent: z.boolean()
  })
  .openapi('SearchPlaylist')

const toSearchPlaylist = (playlist: z.infer<typeof SearchPlaylistRawSchema>): z.infer<typeof SearchPlaylistSchema> => ({
  id: playlist.id,
  name: playlist.title,
  type: playlist.type,
  image: imageLinks(playlist.image),
  url: playlist.perma_url,
  songCount: playlist.more_info.song_count ? Number(playlist.more_info.song_count) : null,
  language: playlist.more_info.language,
  explicitContent: playlist.explicit_content === '1'
})

export const SearchPlaylistsRawSchema = paginated(SearchPlaylistRawSchema)
export const SearchPlaylistsSchema = paginated(SearchPlaylistSchema).openapi('SearchPlaylists')
export { toSearchPlaylist }
