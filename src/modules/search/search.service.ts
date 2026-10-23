import { JioSaavnEndpoint } from '#lib/constants.js'
import { fetchJioSaavn } from '#lib/http.js'
import { parseUpstream } from '#lib/validate.js'
import { toSong } from '#modules/songs/songs.schema.js'
import { toArtistCredit } from '#schemas/common.js'
import {
  SearchAlbumsRawSchema,
  SearchAllRawSchema,
  SearchArtistsRawSchema,
  SearchPlaylistsRawSchema,
  SearchSongsRawSchema,
  toSearchAlbum,
  toSearchAll,
  toSearchPlaylist,
  type SearchAlbumsSchema,
  type SearchAllSchema,
  type SearchArtistsSchema,
  type SearchPlaylistsSchema,
  type SearchSongsSchema
} from './search.schema.js'
import type { z } from '@hono/zod-openapi'

/** JioSaavn's `p` is 1-indexed and `p=0` returns a differently ordered, offset result set — our public API's
 * `page` is 0-indexed like every other paginated endpoint here, so it is offset by one before the upstream call. */
interface Pagination {
  page: number
  limit: number
}

export async function searchAll(query: string): Promise<z.infer<typeof SearchAllSchema>> {
  const { data } = await fetchJioSaavn({ call: JioSaavnEndpoint.search.all, params: { query } })
  return toSearchAll(parseUpstream(SearchAllRawSchema, data, JioSaavnEndpoint.search.all))
}

export async function searchSongs({
  query,
  page,
  limit
}: { query: string } & Pagination): Promise<z.infer<typeof SearchSongsSchema>> {
  const { data } = await fetchJioSaavn({
    call: JioSaavnEndpoint.search.songs,
    params: { q: query, p: page + 1, n: limit }
  })
  const result = parseUpstream(SearchSongsRawSchema, data, JioSaavnEndpoint.search.songs)

  return { total: result.total, start: page * limit, results: result.results.map(toSong) }
}

export async function searchAlbums({
  query,
  page,
  limit
}: { query: string } & Pagination): Promise<z.infer<typeof SearchAlbumsSchema>> {
  const { data } = await fetchJioSaavn({
    call: JioSaavnEndpoint.search.albums,
    params: { q: query, p: page + 1, n: limit }
  })
  const result = parseUpstream(SearchAlbumsRawSchema, data, JioSaavnEndpoint.search.albums)

  return { total: result.total, start: page * limit, results: result.results.map(toSearchAlbum) }
}

export async function searchArtists({
  query,
  page,
  limit
}: { query: string } & Pagination): Promise<z.infer<typeof SearchArtistsSchema>> {
  const { data } = await fetchJioSaavn({
    call: JioSaavnEndpoint.search.artists,
    params: { q: query, p: page + 1, n: limit }
  })
  const result = parseUpstream(SearchArtistsRawSchema, data, JioSaavnEndpoint.search.artists)

  return { total: result.total, start: page * limit, results: result.results.map(toArtistCredit) }
}

export async function searchPlaylists({
  query,
  page,
  limit
}: { query: string } & Pagination): Promise<z.infer<typeof SearchPlaylistsSchema>> {
  const { data } = await fetchJioSaavn({
    call: JioSaavnEndpoint.search.playlists,
    params: { q: query, p: page + 1, n: limit }
  })
  const result = parseUpstream(SearchPlaylistsRawSchema, data, JioSaavnEndpoint.search.playlists)

  return { total: result.total, start: page * limit, results: result.results.map(toSearchPlaylist) }
}
