import { describe, expect, it } from 'vitest'
import { searchApp } from './search.routes'
import {
  SearchAlbumsSchema,
  SearchAllSchema,
  SearchArtistsSchema,
  SearchPlaylistsSchema,
  SearchSongsSchema
} from './search.schema'

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
})
