import { z } from '@hono/zod-openapi'
import { JioSaavnEndpoint } from '#lib/constants.js'
import { fetchJioSaavn } from '#lib/http.js'
import { parseUpstream } from '#lib/validate.js'
import { HTTPException } from 'hono/http-exception'
import {
  LyricsRawSchema,
  SongRawSchema,
  SongStationRawSchema,
  toLyrics,
  toSong,
  type LyricsSchema,
  type SongSchema
} from './songs.schema.js'

const SongsByIdRawSchema = z.object({ songs: z.array(SongRawSchema).default([]) })

export async function getSongsByIds(songIds: string): Promise<z.infer<typeof SongSchema>[]> {
  const { data } = await fetchJioSaavn({ call: JioSaavnEndpoint.songs.byId, params: { pids: songIds } })
  const { songs } = parseUpstream(SongsByIdRawSchema, data, 'song.getDetails')

  if (!songs.length) throw new HTTPException(404, { message: 'song not found' })

  return songs.map(toSong)
}

export async function getSongByLink(token: string): Promise<z.infer<typeof SongSchema>[]> {
  const { data } = await fetchJioSaavn({
    call: JioSaavnEndpoint.songs.byLink,
    params: { token, type: 'song' }
  })
  const { songs } = parseUpstream(SongsByIdRawSchema, data, 'webapi.get (song)')

  if (!songs.length) throw new HTTPException(404, { message: 'song not found' })

  return songs.map(toSong)
}

export async function createSongStation(songId: string): Promise<string> {
  const { data, ok } = await fetchJioSaavn<{ stationid?: string }>({
    call: JioSaavnEndpoint.songs.station,
    params: {
      entity_id: JSON.stringify([encodeURIComponent(songId)]),
      entity_type: 'queue'
    },
    context: 'android'
  })

  if (!ok || !data.stationid) throw new HTTPException(502, { message: 'could not create station for song' })

  return data.stationid
}

/**
 * Pulls queued songs off any JioSaavn radio station (song suggestions, featured, or artist stations all share
 * this same `webradio.getSong` mechanism). Stations frequently have nothing queued — that's a normal, valid
 * empty result, not an error.
 */
export async function fetchStationSongs(stationId: string, limit: number): Promise<z.infer<typeof SongSchema>[]> {
  const { data, ok } = await fetchJioSaavn({
    call: JioSaavnEndpoint.songs.suggestions,
    params: { stationid: stationId, k: limit },
    context: 'android'
  })

  if (!ok) return []

  const {
    stationid: _stationid,
    error: _error,
    ...entries
  } = parseUpstream(SongStationRawSchema, data, 'webradio.getSong')

  const songs: z.infer<typeof SongSchema>[] = []
  for (const entry of Object.values(entries)) {
    if (typeof entry !== 'object' || entry === null || !('song' in entry)) continue

    const parsed = SongRawSchema.safeParse((entry as { song: unknown }).song)
    if (parsed.success) {
      songs.push(toSong(parsed.data))
    } else {
      const detail = parsed.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`).join('; ')
      console.error(`[webradio.getSong] ✗ skipping a station song that failed to parse: ${detail}`)
    }
  }

  return songs.slice(0, limit)
}

export async function getSongSuggestions(songId: string, limit: number): Promise<z.infer<typeof SongSchema>[]> {
  const stationId = await createSongStation(songId)
  return fetchStationSongs(stationId, limit)
}

export async function getSongLyrics(songId: string): Promise<z.infer<typeof LyricsSchema>> {
  const { data, ok } = await fetchJioSaavn({ call: JioSaavnEndpoint.songs.lyrics, params: { lyrics_id: songId } })

  if (!ok || typeof data !== 'object' || data === null || !('lyrics' in data)) {
    throw new HTTPException(404, { message: 'lyrics not found for the given song' })
  }

  return toLyrics(parseUpstream(LyricsRawSchema, data, JioSaavnEndpoint.songs.lyrics))
}
