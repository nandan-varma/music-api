import { JioSaavnEndpoint } from '#lib/constants.js'
import { fetchJioSaavn } from '#lib/http.js'
import { parseUpstream } from '#lib/validate.js'
import { HTTPException } from 'hono/http-exception'
import { PlaylistRawSchema, toPlaylist, type PlaylistSchema } from './playlists.schema.js'
import type { z } from '@hono/zod-openapi'

interface PlaylistArgs {
  page: number
  limit: number
}

async function fetchPlaylist(
  call: string,
  params: Record<string, string | number>
): Promise<z.infer<typeof PlaylistSchema>> {
  const { data } = await fetchJioSaavn({ call, params })
  const raw = parseUpstream(PlaylistRawSchema, data, call)

  // Like albums and artists, an unknown ID/token comes back as a real object with every field blanked out.
  if (!raw.title) throw new HTTPException(404, { message: 'playlist not found' })

  // `list_count` is JioSaavn's genuine, page-independent total (verified: it stays constant across
  // pages of the same playlist) — do not overwrite it with `songs.length`, which is just this
  // page's size and breaks every consumer's pagination math (it looks like `hasMore` forever).
  return toPlaylist(raw)
}

/** JioSaavn's `p` is 1-indexed (`p=0` and `p=1` both return the first page) — our public API's
 * `page` is 0-indexed to match every other paginated endpoint here, so it must be offset by one. */
export const getPlaylistById = (id: string, { page, limit }: PlaylistArgs) =>
  fetchPlaylist(JioSaavnEndpoint.playlists.byId, { listid: id, n: limit, p: page + 1 })

export const getPlaylistByLink = (token: string, { page, limit }: PlaylistArgs) =>
  fetchPlaylist(JioSaavnEndpoint.playlists.byLink, { token, type: 'playlist', n: limit, p: page + 1 })
