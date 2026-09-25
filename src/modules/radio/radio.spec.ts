import { SongSchema } from '#modules/songs/songs.schema.js'
import { describe, expect, it } from 'vitest'
import { radioApp } from './radio.routes.js'

describe('radio routes', () => {
  // JioSaavn's radio stations frequently have nothing queued for a freshly created station, so this only
  // asserts a well-formed (possibly empty) response rather than requiring actual songs.
  it('retrieves songs from a featured station', async () => {
    const response = await radioApp.request('/radio/featured?name=Bollywood+Butter&language=hindi&limit=3')

    expect(response.status).toBe(200)
    const { data } = (await response.json()) as { data: unknown[] }
    expect(() => SongSchema.array().parse(data)).not.toThrow()
  })

  it('requires both name and language', async () => {
    const response = await radioApp.request('/radio/featured?name=Bollywood+Butter')
    expect(response.status).toBe(400)
  })
})
