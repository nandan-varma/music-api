import { JioSaavnEndpoint } from '#lib/constants.js'
import { fetchJioSaavn } from '#lib/http.js'
import { parseUpstream } from '#lib/validate.js'
import { toAlbum } from '#modules/albums/albums.schema.js'
import { toSong } from '#modules/songs/songs.schema.js'
import { HTTPException } from 'hono/http-exception'
import {
  ArtistAlbumsRawSchema,
  ArtistRawSchema,
  ArtistSongsRawSchema,
  toArtist,
  type ArtistAlbumsSchema,
  type ArtistSchema,
  type ArtistSongsSchema
} from './artists.schema.js'
import type { z } from '@hono/zod-openapi'

export type ArtistSort = 'popularity' | 'latest' | 'alphabetical'
export type SortOrder = 'asc' | 'desc'

interface ArtistListingArgs {
  page: number
  sortBy: ArtistSort
  sortOrder: SortOrder
}

async function fetchArtist(
  call: string,
  params: Record<string, string | number>
): Promise<z.infer<typeof ArtistSchema>> {
  const { data } = await fetchJioSaavn({ call, params })
  const artist = parseUpstream(ArtistRawSchema, data, call)

  // Like albums, an unknown artist ID/token comes back as a real (200) object with every field blanked out.
  if (!artist.name) throw new HTTPException(404, { message: 'artist not found' })

  return toArtist(artist)
}

export const getArtistById = (artistId: string, args: ArtistListingArgs & { songCount: number; albumCount: number }) =>
  fetchArtist(JioSaavnEndpoint.artists.byId, {
    artistId,
    n_song: args.songCount,
    n_album: args.albumCount,
    page: args.page,
    sort_order: args.sortOrder,
    category: args.sortBy
  })

export const getArtistByLink = (token: string, args: ArtistListingArgs & { songCount: number; albumCount: number }) =>
  fetchArtist(JioSaavnEndpoint.artists.byLink, {
    token,
    type: 'artist',
    n_song: args.songCount,
    n_album: args.albumCount,
    page: args.page,
    sort_order: args.sortOrder,
    category: args.sortBy
  })

export async function getArtistSongs(
  artistId: string,
  args: ArtistListingArgs
): Promise<z.infer<typeof ArtistSongsSchema>> {
  const { data } = await fetchJioSaavn({
    call: JioSaavnEndpoint.artists.songs,
    params: { artistId, page: args.page, sort_order: args.sortOrder, category: args.sortBy }
  })

  const { topSongs } = parseUpstream(ArtistSongsRawSchema, data, JioSaavnEndpoint.artists.songs)

  return { total: topSongs.total, songs: topSongs.songs.map(toSong) }
}

export async function getArtistAlbums(
  artistId: string,
  args: ArtistListingArgs
): Promise<z.infer<typeof ArtistAlbumsSchema>> {
  const { data } = await fetchJioSaavn({
    call: JioSaavnEndpoint.artists.albums,
    params: { artistId, page: args.page, sort_order: args.sortOrder, category: args.sortBy }
  })

  const { topAlbums } = parseUpstream(ArtistAlbumsRawSchema, data, JioSaavnEndpoint.artists.albums)

  return { total: topAlbums.total, albums: topAlbums.albums.map(toAlbum) }
}
