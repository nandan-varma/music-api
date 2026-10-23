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

/** Validates each entry on its own and skips the ones that don't parse, so one odd song never fails a batch. */
function parseSongEntries(entries: unknown[], source: string): z.infer<typeof SongSchema>[] {
  const songs: z.infer<typeof SongSchema>[] = []
  for (const entry of entries) {
    const parsed = SongRawSchema.safeParse(entry)
    if (parsed.success) {
      songs.push(toSong(parsed.data))
    } else {
      const detail = parsed.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`).join('; ')
      console.error(`[${source}] ✗ skipping a song that failed to parse: ${detail}`)
    }
  }
  return songs
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

  const queued = Object.values(entries)
    .filter((entry): entry is { song: unknown } => typeof entry === 'object' && entry !== null && 'song' in entry)
    .map((entry) => entry.song)

  return parseSongEntries(queued, 'webradio.getSong').slice(0, limit)
}

/** JioSaavn's "you might also like" for a song. Unlike stations this reliably has results; it answers with
 * an object keyed by the requested song ID. */
export async function getSongRecommendations(songId: string, limit: number): Promise<z.infer<typeof SongSchema>[]> {
  const { data, ok } = await fetchJioSaavn<Record<string, unknown>>({
    call: JioSaavnEndpoint.songs.recommendations,
    params: { pid: songId },
    context: 'android'
  })

  const entries = ok && typeof data === 'object' && data !== null ? data[songId] : undefined
  if (!Array.isArray(entries)) return []

  return parseSongEntries(entries, 'reco.getreco').slice(0, limit)
}

export async function getSongSuggestions(songId: string, limit: number): Promise<z.infer<typeof SongSchema>[]> {
  const recommendations = await getSongRecommendations(songId, limit)
  if (recommendations.length > 0) return recommendations

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
