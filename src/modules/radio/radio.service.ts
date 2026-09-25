import { JioSaavnEndpoint } from '#lib/constants.js'
import { fetchJioSaavn } from '#lib/http.js'
import { getArtistById } from '#modules/artists/artists.service.js'
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
  return fetchStationSongs(stationId, limit)
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

  return fetchStationSongs(stationId, limit)
}
