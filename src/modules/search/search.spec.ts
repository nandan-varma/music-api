import { describe, expect, it } from 'vitest'
import { searchApp } from './search.routes.js'
import {
  SearchAlbumsSchema,
  SearchAllSchema,
  SearchArtistsSchema,
  SearchPlaylistsSchema,
  SearchSongsSchema
} from './search.schema.js'

describe('search routes', () => {
  it('searches everything', async () => {
    const response = await searchApp.request('/search?query=blurryface+twenty+one+pilots')

    const { data } = (await response.json()) as { data: unknown }
    expect(() => SearchAllSchema.parse(data)).not.toThrow()
  })

  it('searches songs', async () => {
    const response = await searchApp.request('/search/songs?query=believer')

    const { data } = (await response.json()) as { data: unknown }
    expect(() => SearchSongsSchema.parse(data)).not.toThrow()
  })

  it('searches albums', async () => {
    const response = await searchApp.request('/search/albums?query=blurryface+twenty+one+pilots')

    const { data } = (await response.json()) as { data: unknown }
    expect(() => SearchAlbumsSchema.parse(data)).not.toThrow()
  })

  it('searches artists', async () => {
    const response = await searchApp.request('/search/artists?query=adele')

    const { data } = (await response.json()) as { data: unknown }
    expect(() => SearchArtistsSchema.parse(data)).not.toThrow()
  })

  it('searches playlists', async () => {
    const response = await searchApp.request('/search/playlists?query=indie')

    const { data } = (await response.json()) as { data: unknown }
    expect(() => SearchPlaylistsSchema.parse(data)).not.toThrow()
  })

  it('paginates from page 0 with a zero-based start offset', async () => {
    const first = await searchApp.request('/search/songs?query=love&page=0&limit=5')
    const second = await searchApp.request('/search/songs?query=love&page=1&limit=5')
    const firstPage = ((await first.json()) as { data: { start: number; results: { id: string }[] } }).data
    const secondPage = ((await second.json()) as { data: { start: number; results: { id: string }[] } }).data

    expect(firstPage.start).toBe(0)
    expect(secondPage.start).toBe(5)
    expect(firstPage.results).toHaveLength(5)
    expect(secondPage.results.length).toBeGreaterThan(0)
  })
})
