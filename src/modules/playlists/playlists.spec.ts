import { describe, expect, it } from 'vitest'
import { playlistsApp } from './playlists.routes'
import { PlaylistSchema } from './playlists.schema'

describe('playlists routes', () => {
  it('retrieves a playlist by featured link', async () => {
    const response = await playlistsApp.request(
      '/playlists?link=https://www.jiosaavn.com/featured/its-indie-english/AMoxtXyKHoU_'
    )

    const { data } = (await response.json()) as { data: unknown }
    expect(() => PlaylistSchema.parse(data)).not.toThrow()
  })

  it('retrieves a playlist by saavn domain link', async () => {
    const response = await playlistsApp.request(
      '/playlists?link=https://www.saavn.com/s/playlist/cf3c2fb07449311f87f53670da0e3d20/gautham-menon-telugu-hits/4sylrSC21MjvZ3uUE6bUVw__'
    )

    const { data } = (await response.json()) as { data: unknown }
    expect(() => PlaylistSchema.parse(data)).not.toThrow()
  })

  it('retrieves a playlist by ID', async () => {
    const response = await playlistsApp.request('/playlists?id=82914609')

    const { data } = (await response.json()) as { data: unknown }
    expect(() => PlaylistSchema.parse(data)).not.toThrow()
  })

  it('requires either id or link', async () => {
    const response = await playlistsApp.request('/playlists')
    expect(response.status).toBe(400)
  })
})
