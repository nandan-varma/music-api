import { z } from '@hono/zod-openapi'
import { decryptMediaLinks, imageLinks } from '#lib/codecs'
import { ArtistCreditRawSchema, ArtistCreditSchema, LinkSchema, toArtistCredit } from '#schemas/common'

/** Only the fields we actually read from `song.getDetails` / `webapi.get?type=song` — see songs.service.ts. */
export const SongRawSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  perma_url: z.string(),
  image: z.string(),
  language: z.string(),
  year: z.string().nullable().default(null),
  play_count: z.string().nullable().default(null),
  explicit_content: z.string(),
  more_info: z.object({
    album_id: z.string().nullable().default(null),
    album: z.string().nullable().default(null),
    album_url: z.string().nullable().default(null),
    label: z.string().nullable().default(null),
    duration: z.string().nullable().default(null),
    release_date: z.string().nullable().default(null),
    has_lyrics: z.string(),
    lyrics_id: z.string().nullable().default(null),
    copyright_text: z.string().nullable().default(null),
    encrypted_media_url: z.string().nullable().default(null),
    artistMap: z.object({
      primary_artists: z.array(ArtistCreditRawSchema).default([]),
      featured_artists: z.array(ArtistCreditRawSchema).default([]),
      artists: z.array(ArtistCreditRawSchema).default([])
    })
  })
})

export const SongSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    year: z.string().nullable(),
    releaseDate: z.string().nullable(),
    duration: z.number().nullable(),
    label: z.string().nullable(),
    explicitContent: z.boolean(),
    playCount: z.number().nullable(),
    language: z.string(),
    hasLyrics: z.boolean(),
    lyricsId: z.string().nullable(),
    url: z.string(),
    copyright: z.string().nullable(),
    album: z.object({
      id: z.string().nullable(),
      name: z.string().nullable(),
      url: z.string().nullable()
    }),
    artists: z.object({
      primary: z.array(ArtistCreditSchema),
      featured: z.array(ArtistCreditSchema),
      all: z.array(ArtistCreditSchema)
    }),
    image: z.array(LinkSchema),
    downloadUrl: z.array(LinkSchema)
  })
  .openapi('Song')

export const toSong = (song: z.infer<typeof SongRawSchema>): z.infer<typeof SongSchema> => ({
  id: song.id,
  name: song.title,
  type: song.type,
  year: song.year,
  releaseDate: song.more_info.release_date,
  duration: song.more_info.duration ? Number(song.more_info.duration) : null,
  label: song.more_info.label,
  explicitContent: song.explicit_content === '1',
  playCount: song.play_count ? Number(song.play_count) : null,
  language: song.language,
  hasLyrics: song.more_info.has_lyrics === 'true',
  lyricsId: song.more_info.lyrics_id,
  url: song.perma_url,
  copyright: song.more_info.copyright_text,
  album: {
    id: song.more_info.album_id,
    name: song.more_info.album,
    url: song.more_info.album_url
  },
  artists: {
    primary: song.more_info.artistMap.primary_artists.map(toArtistCredit),
    featured: song.more_info.artistMap.featured_artists.map(toArtistCredit),
    all: song.more_info.artistMap.artists.map(toArtistCredit)
  },
  image: imageLinks(song.image),
  downloadUrl: song.more_info.encrypted_media_url ? decryptMediaLinks(song.more_info.encrypted_media_url) : []
})

/**
 * Besides `stationid`, JioSaavn keys every queued song by an opaque, unpredictable ID — `.catchall()` (not
 * `.and(z.record(...))`) is required here because a record intersection would force `stationid` itself to
 * match the record's value type. When the station has nothing queued, those dynamic keys are absent entirely
 * and an `error` string appears instead, so every non-`stationid` value must tolerate that too.
 */
export const SongStationRawSchema = z
  .object({ stationid: z.string(), error: z.string().optional() })
  .catchall(z.union([z.object({ song: SongRawSchema }), z.string()]))

export const LyricsRawSchema = z.object({
  lyrics: z.string(),
  snippet: z.string().nullable().default(null),
  lyrics_copyright: z.string().nullable().default(null)
})

export const LyricsSchema = z
  .object({
    lyrics: z.string().openapi({ description: 'Full lyrics, with line breaks as `<br>`' }),
    snippet: z.string().nullable(),
    copyright: z.string().nullable()
  })
  .openapi('Lyrics')

export const toLyrics = (lyrics: z.infer<typeof LyricsRawSchema>): z.infer<typeof LyricsSchema> => ({
  lyrics: lyrics.lyrics,
  snippet: lyrics.snippet,
  copyright: lyrics.lyrics_copyright
})
