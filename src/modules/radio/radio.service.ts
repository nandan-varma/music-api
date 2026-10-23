import { JioSaavnEndpoint } from '#lib/constants.js'
import { fetchJioSaavn } from '#lib/http.js'
import { getArtistById, getArtistSongs } from '#modules/artists/artists.service.js'
import { getPlaylistById } from '#modules/playlists/playlists.service.js'
import { searchPlaylists } from '#modules/search/search.service.js'
import { fetchStationSongs } from '#modules/songs/songs.service.js'
import { HTTPException } from 'hono/http-exception'
import type { z } from '@hono/zod-openapi'
import type { SongSchema } from '#modules/songs/songs.schema.js'

async function createStation(call: string, params: Record<string, string>): Promise<string> {
  const { data, ok } = await fetchJioSaavn<{ stationid?: string }>({ call, params, context: 'android' })

  if (!ok || !data.stationid) throw new HTTPException(502, { message: 'could not create radio station' })

  return data.stationid
}

/** `name` is one of JioSaavn's editorial station names (e.g. "Bollywood Butter", "90s Love") — there is no
 * endpoint that lists valid names; they're discoverable only from the JioSaavn web/app UI. */
export async function getFeaturedRadio(
  name: string,
  language: string,
  limit: number
): Promise<z.infer<typeof SongSchema>[]> {
  const stationId = await createStation(JioSaavnEndpoint.radio.featured, { name, language })
  const queued = await fetchStationSongs(stationId, limit)
  if (queued.length > 0) return queued

  // A fresh station usually has nothing queued, so fall back to the playlist that best matches its name.
  const { results } = await searchPlaylists({ query: `${name} ${language}`, page: 1, limit: 1 })
  const playlist = results[0]
  if (!playlist) return []
  return (await getPlaylistById(playlist.id, { page: 0, limit })).songs
}

export async function getArtistRadio(artistId: string, limit: number): Promise<z.infer<typeof SongSchema>[]> {
  const artist = await getArtistById(artistId, {
    page: 0,
    sortBy: 'popularity',
    sortOrder: 'asc',
    songCount: 1,
    albumCount: 1
  })

  const stationId = await createStation(JioSaavnEndpoint.radio.artist, {
    name: artist.name,
    query: artist.name,
    language: artist.dominantLanguage ?? 'hindi'
  })

  const queued = await fetchStationSongs(stationId, limit)
  if (queued.length > 0) return queued

  // No station queued: fall back to the artist's most popular songs.
  const { songs } = await getArtistSongs(artistId, { page: 0, sortBy: 'popularity', sortOrder: 'desc' })
  return songs.slice(0, limit)
}
