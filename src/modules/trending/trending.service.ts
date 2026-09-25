import { z } from '@hono/zod-openapi'
import { JioSaavnEndpoint } from '#lib/constants'
import { fetchJioSaavn } from '#lib/http'
import { parseUpstream } from '#lib/validate'
import { AlbumRawSchema, toAlbum, type AlbumSchema } from '#modules/albums/albums.schema'
import { PlaylistRawSchema, toPlaylist, type PlaylistSchema } from '#modules/playlists/playlists.schema'
import { SongRawSchema, toSong, type SongSchema } from '#modules/songs/songs.schema'

export type TrendingType = 'song' | 'album' | 'playlist'

export type TrendingItem<T extends TrendingType> = T extends 'song'
  ? z.infer<typeof SongSchema>
  : T extends 'album'
    ? z.infer<typeof AlbumSchema>
    : z.infer<typeof PlaylistSchema>

/** `entity_language` is mandatory upstream — an empty value silently returns zero results. */
export async function getTrending<T extends TrendingType>(type: T, language: string): Promise<TrendingItem<T>[]> {
  const { data } = await fetchJioSaavn<unknown[]>({
    call: JioSaavnEndpoint.trending,
    params: { entity_type: type, entity_language: language }
  })

  const resource = `content.getTrending (${type})`

  switch (type) {
    case 'song':
      return parseUpstream(z.array(SongRawSchema), data, resource).map(toSong) as TrendingItem<T>[]
    case 'album':
      return parseUpstream(z.array(AlbumRawSchema), data, resource).map(toAlbum) as TrendingItem<T>[]
    case 'playlist':
      return parseUpstream(z.array(PlaylistRawSchema), data, resource).map(toPlaylist) as TrendingItem<T>[]
  }

  throw new Error(`unreachable trending type: ${String(type)}`)
}
