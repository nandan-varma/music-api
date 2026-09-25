import { z } from '@hono/zod-openapi'
import { JioSaavnEndpoint } from '#lib/constants'
import { fetchJioSaavn } from '#lib/http'
import { parseUpstream } from '#lib/validate'
import { HTTPException } from 'hono/http-exception'
import {
  LyricsRawSchema,
  SongRawSchema,
  SongStationRawSchema,
  toLyrics,
  toSong,
  type LyricsSchema,
  type SongSchema
} from './songs.schema'

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

export async function getSongSuggestions(songId: string, limit: number): Promise<z.infer<typeof SongSchema>[]> {
  const stationId = await createSongStation(songId)

  const { data, ok } = await fetchJioSaavn({
    call: JioSaavnEndpoint.songs.suggestions,
    params: { stationid: stationId, k: limit },
    context: 'android'
  })

  if (!ok) throw new HTTPException(404, { message: 'no suggestions found for the given song' })

  const { stationid: _stationid, ...suggestions } = parseUpstream(SongStationRawSchema, data, 'webradio.getSong')

  return Object.values(suggestions)
    .filter((entry) => entry !== null)
    .map((entry) => toSong(entry.song))
    .slice(0, limit)
}

export async function getSongLyrics(songId: string): Promise<z.infer<typeof LyricsSchema>> {
  const { data, ok } = await fetchJioSaavn({ call: JioSaavnEndpoint.songs.lyrics, params: { lyrics_id: songId } })

  if (!ok || typeof data !== 'object' || data === null || !('lyrics' in data)) {
    throw new HTTPException(404, { message: 'lyrics not found for the given song' })
  }

  return toLyrics(parseUpstream(LyricsRawSchema, data, JioSaavnEndpoint.songs.lyrics))
}
