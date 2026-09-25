import { SongSchema } from '#modules/songs/songs.schema'
import { describe, expect, it } from 'vitest'
import { artistsApp } from './artists.routes'
import { ArtistSchema } from './artists.schema'

describe('artists routes', () => {
  it('retrieves an artist by link', async () => {
    const response = await artistsApp.request(
      '/artists?link=https://www.jiosaavn.com/artist/dua-lipa-songs/r-OWIKgpX2I_'
    )

    const { data } = (await response.json()) as { data: unknown }
    expect(() => ArtistSchema.parse(data)).not.toThrow()
  })

  it('retrieves an artist by ID', async () => {
    const response = await artistsApp.request('/artists/1274170')

    const { data } = (await response.json()) as { data: unknown }
    expect(() => ArtistSchema.parse(data)).not.toThrow()
  })

  it('404s for an unknown artist ID', async () => {
    const response = await artistsApp.request('/artists/999999999999')
    expect(response.status).toBe(404)
  })

  it('requires either id or link', async () => {
    const response = await artistsApp.request('/artists')
    expect(response.status).toBe(400)
  })

  it('retrieves artist radio', async () => {
    const response = await artistsApp.request('/artists/1274170/radio?limit=3')

    expect(response.status).toBe(200)
    const { data } = (await response.json()) as { data: unknown[] }
    expect(() => SongSchema.array().parse(data)).not.toThrow()
  })
})
