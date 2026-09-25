import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import {
  SearchAlbumsSchema,
  SearchAllSchema,
  SearchArtistsSchema,
  SearchPlaylistsSchema,
  SearchSongsSchema
} from './search.schema'
import { searchAlbums, searchAll, searchArtists, searchPlaylists, searchSongs } from './search.service'

export const searchApp = new OpenAPIHono()

const paginationQuery = z.object({
  page: z.string().pipe(z.coerce.number()).optional().openapi({ example: '0', default: '0' }),
  limit: z.string().pipe(z.coerce.number()).optional().openapi({ example: '10', default: '10' })
})

const successResponse = <T extends z.ZodType>(schema: T) => ({
  200: {
    description: 'Successful response',
    content: {
      'application/json': { schema: z.object({ success: z.boolean().openapi({ example: true }), data: schema }) }
    }
  }
})

searchApp.openapi(
  createRoute({
    method: 'get',
    path: '/search',
    tags: ['Search'],
    summary: 'Global search',
    description: 'Search for songs, albums, artists, and playlists based on the provided query string.',
    operationId: 'globalSearch',
    request: { query: z.object({ query: z.string().openapi({ example: 'Imagine Dragons' }) }) },
    responses: successResponse(SearchAllSchema)
  }),
  async (ctx) => {
    const { query } = ctx.req.valid('query')
    return ctx.json({ success: true as const, data: await searchAll(query) })
  }
)

searchApp.openapi(
  createRoute({
    method: 'get',
    path: '/search/songs',
    tags: ['Search'],
    summary: 'Search for songs',
    description: 'Search for songs based on the provided query',
    operationId: 'searchSongs',
    request: { query: z.object({ query: z.string().openapi({ example: 'Believer' }) }).merge(paginationQuery) },
    responses: successResponse(SearchSongsSchema)
  }),
  async (ctx) => {
    const { query, page = 0, limit = 10 } = ctx.req.valid('query')
    return ctx.json({ success: true as const, data: await searchSongs({ query, page, limit }) })
  }
)

searchApp.openapi(
  createRoute({
    method: 'get',
    path: '/search/albums',
    tags: ['Search'],
    summary: 'Search for albums',
    description: 'Search for albums based on the provided query',
    operationId: 'searchAlbums',
    request: { query: z.object({ query: z.string().openapi({ example: 'Evolve' }) }).merge(paginationQuery) },
    responses: successResponse(SearchAlbumsSchema)
  }),
  async (ctx) => {
    const { query, page = 0, limit = 10 } = ctx.req.valid('query')
    return ctx.json({ success: true as const, data: await searchAlbums({ query, page, limit }) })
  }
)

searchApp.openapi(
  createRoute({
    method: 'get',
    path: '/search/artists',
    tags: ['Search'],
    summary: 'Search for artists',
    description: 'Search for artists based on the provided query',
    operationId: 'searchArtists',
    request: { query: z.object({ query: z.string().openapi({ example: 'Adele' }) }).merge(paginationQuery) },
    responses: successResponse(SearchArtistsSchema)
  }),
  async (ctx) => {
    const { query, page = 0, limit = 10 } = ctx.req.valid('query')
    return ctx.json({ success: true as const, data: await searchArtists({ query, page, limit }) })
  }
)

searchApp.openapi(
  createRoute({
    method: 'get',
    path: '/search/playlists',
    tags: ['Search'],
    summary: 'Search for playlists',
    description: 'Search for playlists based on the provided query',
    operationId: 'searchPlaylists',
    request: { query: z.object({ query: z.string().openapi({ example: 'Indie' }) }).merge(paginationQuery) },
    responses: successResponse(SearchPlaylistsSchema)
  }),
  async (ctx) => {
    const { query, page = 0, limit = 10 } = ctx.req.valid('query')
    return ctx.json({ success: true as const, data: await searchPlaylists({ query, page, limit }) })
  }
)
