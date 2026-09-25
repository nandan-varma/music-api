import { describe, expect, it } from 'vitest'
import { songsApp } from './songs.routes.js'
import { LyricsSchema, SongSchema } from './songs.schema.js'

describe('songs routes', () => {
  it('retrieves songs by link', async () => {
    const response = await songsApp.request('/songs?link=https://www.jiosaavn.com/song/houdini/OgwhbhtDRwM')

    const { data } = (await response.json()) as { data: unknown[] }
    expect(() => SongSchema.array().parse(data)).not.toThrow()
  })

  it('retrieves a song by ID', async () => {
    const response = await songsApp.request('/songs/3IoDK8qI')

    const { data } = (await response.json()) as { data: unknown[] }
    expect(() => SongSchema.array().parse(data)).not.toThrow()
  })

  it('requires either ids or link', async () => {
    const response = await songsApp.request('/songs')
    expect(response.status).toBe(400)
  })

  it('retrieves lyrics for a song that has them', async () => {
    const response = await songsApp.request('/songs/aRZbUYD7/lyrics')

    const { data } = (await response.json()) as { data: unknown }
    expect(() => LyricsSchema.parse(data)).not.toThrow()
  })

  it('404s for lyrics of an unknown song', async () => {
    const response = await songsApp.request('/songs/doesnotexist999/lyrics')
    expect(response.status).toBe(404)
  })
})
