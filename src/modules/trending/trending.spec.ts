import { SongSchema } from '#modules/songs/songs.schema.js'
import { describe, expect, it } from 'vitest'
import { trendingApp } from './trending.routes.js'

describe('trending routes', () => {
  it('retrieves trending songs for a language', async () => {
    const response = await trendingApp.request('/trending?type=song&language=hindi')

    const { data } = (await response.json()) as { data: unknown[] }
    expect(() => SongSchema.array().parse(data)).not.toThrow()
    expect(data.length).toBeGreaterThan(0)
  })

  it('requires a language', async () => {
    const response = await trendingApp.request('/trending?type=song')
    expect(response.status).toBe(400)
  })
})
