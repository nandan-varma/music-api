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
  params: Record<string, string | number>,
  limit: number
): Promise<z.infer<typeof PlaylistSchema>> {
  const { data } = await fetchJioSaavn({ call, params })
  const raw = parseUpstream(PlaylistRawSchema, data, call)

  // Like albums and artists, an unknown ID/token comes back as a real object with every field blanked out.
  if (!raw.title) throw new HTTPException(404, { message: 'playlist not found' })

  const playlist = toPlaylist(raw)

  return { ...playlist, songCount: playlist.songs.length, songs: playlist.songs.slice(0, limit) }
}

export const getPlaylistById = (id: string, { page, limit }: PlaylistArgs) =>
  fetchPlaylist(JioSaavnEndpoint.playlists.byId, { listid: id, n: limit, p: page }, limit)

export const getPlaylistByLink = (token: string, { page, limit }: PlaylistArgs) =>
  fetchPlaylist(JioSaavnEndpoint.playlists.byLink, { token, type: 'playlist', n: limit, p: page }, limit)
