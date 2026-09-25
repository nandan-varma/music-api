import { describe, expect, it } from 'vitest'
import { albumsApp } from './albums.routes'
import { AlbumSchema } from './albums.schema'

describe('albums routes', () => {
  it('retrieves an album by link', async () => {
    const response = await albumsApp.request(
      '/albums?link=https://www.jiosaavn.com/album/future-nostalgia/ITIyo-GDr7A_'
    )

    const { data } = (await response.json()) as { data: unknown }
    expect(() => AlbumSchema.parse(data)).not.toThrow()
  })

  it('retrieves an album by ID', async () => {
    const response = await albumsApp.request('/albums?id=23241654')

    const { data } = (await response.json()) as { data: unknown }
    expect(() => AlbumSchema.parse(data)).not.toThrow()
  })

  it('404s for an unknown album ID', async () => {
    const response = await albumsApp.request('/albums?id=999999999999')
    expect(response.status).toBe(404)
  })

  it('requires either id or link', async () => {
    const response = await albumsApp.request('/albums')
    expect(response.status).toBe(400)
  })
})
