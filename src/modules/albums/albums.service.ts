import { JioSaavnEndpoint } from '#lib/constants'
import { fetchJioSaavn } from '#lib/http'
import { parseUpstream } from '#lib/validate'
import { HTTPException } from 'hono/http-exception'
import { AlbumRawSchema, toAlbum, type AlbumSchema } from './albums.schema'
import type { z } from '@hono/zod-openapi'

async function fetchAlbum(call: string, params: Record<string, string | number>): Promise<z.infer<typeof AlbumSchema>> {
  const { data } = await fetchJioSaavn({ call, params })
  const album = parseUpstream(AlbumRawSchema, data, call)

  // JioSaavn never 404s — an unknown ID/token comes back as a real object with every field blanked out.
  if (!album.id) throw new HTTPException(404, { message: 'album not found' })

  return toAlbum(album)
}

export const getAlbumById = (id: string) => fetchAlbum(JioSaavnEndpoint.albums.byId, { albumid: id })

export const getAlbumByLink = (token: string) => fetchAlbum(JioSaavnEndpoint.albums.byLink, { token, type: 'album' })
