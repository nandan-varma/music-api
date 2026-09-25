import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ArtistAlbumsSchema, ArtistSchema, ArtistSongsSchema } from './artists.schema'
import { getArtistAlbums, getArtistById, getArtistByLink, getArtistSongs } from './artists.service'

export const artistsApp = new OpenAPIHono()

const sortBySchema = z.enum(['popularity', 'latest', 'alphabetical']).optional().openapi({
  description: 'The field to sort the results by',
  example: 'popularity'
})

const sortOrderSchema = z.enum(['asc', 'desc']).optional().openapi({
  description: 'The order to sort the results by',
  example: 'desc'
})

const pageSchema = z.string().pipe(z.coerce.number()).optional().openapi({
  description: 'The page number of the results to retrieve',
  example: '0',
  default: '0'
})

artistsApp.openapi(
  createRoute({
    method: 'get',
    path: '/artists',
    tags: ['Artists'],
    summary: 'Retrieve artists by ID or link',
    description: 'Retrieve an artist by ID or by a direct artist link.',
    operationId: 'getArtistByIdOrLink',
    request: {
      query: z.object({
        id: z.string().optional().openapi({ title: 'Artist ID', example: '1274170' }),
        link: z
          .string()
          .url()
          .optional()
          .transform((value) => value?.match(/jiosaavn\.com\/artist\/[^/]+\/([^/]+)$/)?.[1])
          .openapi({
            title: 'Artist Link',
            description: 'A direct link to the artist on JioSaavn',
            type: 'string',
            example: 'https://www.jiosaavn.com/artist/dua-lipa-songs/r-OWIKgpX2I_'
          }),
        page: pageSchema,
        songCount: z
          .string()
          .pipe(z.coerce.number())
          .optional()
          .openapi({ description: 'Number of songs to fetch', example: '10' }),
        albumCount: z
          .string()
          .pipe(z.coerce.number())
          .optional()
          .openapi({ description: 'Number of albums to fetch', example: '10' }),
        sortBy: sortBySchema,
        sortOrder: sortOrderSchema
      })
    },
    responses: {
      200: {
        description: 'Successful response with artist details',
        content: {
          'application/json': {
            schema: z.object({ success: z.boolean().openapi({ example: true }), data: ArtistSchema })
          }
        }
      },
      400: { description: 'Bad request when neither ID nor link is provided' },
      404: { description: 'Artist not found for the given ID or link' }
    }
  }),
  async (ctx) => {
    const {
      link,
      id,
      page = 0,
      sortBy = 'popularity',
      sortOrder = 'asc',
      songCount = 10,
      albumCount = 10
    } = ctx.req.valid('query')

    if (!id && !link) {
      return ctx.json({ success: false as const, message: 'Either artist ID or link is required' }, 400)
    }

    const args = { page, sortBy, sortOrder, songCount, albumCount }
    const artist = link ? await getArtistByLink(link, args) : await getArtistById(id!, args)

    return ctx.json({ success: true as const, data: artist })
  }
)

artistsApp.openapi(
  createRoute({
    method: 'get',
    path: '/artists/{id}',
    tags: ['Artists'],
    summary: 'Retrieve artist by ID',
    description: 'Retrieve artist by ID',
    operationId: 'getArtistById',
    request: {
      params: z.object({ id: z.string().openapi({ title: 'Artist ID', example: '1274170' }) }),
      query: z.object({
        page: pageSchema,
        songCount: z.string().pipe(z.coerce.number()).optional().openapi({ example: '10' }),
        albumCount: z.string().pipe(z.coerce.number()).optional().openapi({ example: '10' }),
        sortBy: sortBySchema,
        sortOrder: sortOrderSchema
      })
    },
    responses: {
      200: {
        description: 'Successful response with artist details',
        content: {
          'application/json': {
            schema: z.object({ success: z.boolean().openapi({ example: true }), data: ArtistSchema })
          }
        }
      },
      404: { description: 'Artist not found for the given ID' }
    }
  }),
  async (ctx) => {
    const artistId = ctx.req.param('id')
    const {
      page = 0,
      sortBy = 'popularity',
      sortOrder = 'asc',
      songCount = 10,
      albumCount = 10
    } = ctx.req.valid('query')

    const artist = await getArtistById(artistId, { page, sortBy, sortOrder, songCount, albumCount })

    return ctx.json({ success: true as const, data: artist })
  }
)

artistsApp.openapi(
  createRoute({
    method: 'get',
    path: '/artists/{id}/songs',
    tags: ['Artists'],
    summary: `Retrieve artist's songs`,
    description: 'Retrieve a list of songs for a given artist by their ID, with optional sorting and pagination.',
    operationId: 'getArtistSongs',
    request: {
      params: z.object({ id: z.string().openapi({ example: '1274170', default: '1274170' }) }),
      query: z.object({ page: pageSchema, sortBy: sortBySchema, sortOrder: sortOrderSchema })
    },
    responses: {
      200: {
        description: 'Successful response with a list of songs for the artist',
        content: {
          'application/json': {
            schema: z.object({ success: z.boolean().openapi({ example: true }), data: ArtistSongsSchema })
          }
        }
      },
      404: { description: 'Artist not found for the given ID' }
    }
  }),
  async (ctx) => {
    const artistId = ctx.req.param('id')
    const { page = 0, sortBy = 'popularity', sortOrder = 'desc' } = ctx.req.valid('query')

    const songs = await getArtistSongs(artistId, { page, sortBy, sortOrder })

    return ctx.json({ success: true as const, data: songs })
  }
)

artistsApp.openapi(
  createRoute({
    method: 'get',
    path: '/artists/{id}/albums',
    tags: ['Artists'],
    summary: `Retrieve artist's albums`,
    description: 'Retrieve a list of albums for a given artist by their ID, with optional sorting and pagination.',
    operationId: 'getArtistAlbums',
    request: {
      params: z.object({ id: z.string().openapi({ example: '1274170', default: '1274170' }) }),
      query: z.object({ page: pageSchema, sortBy: sortBySchema, sortOrder: sortOrderSchema })
    },
    responses: {
      200: {
        description: 'Successful response with a list of albums for the artist',
        content: {
          'application/json': {
            schema: z.object({ success: z.boolean().openapi({ example: true }), data: ArtistAlbumsSchema })
          }
        }
      },
      404: { description: 'Artist not found for the given ID' }
    }
  }),
  async (ctx) => {
    const artistId = ctx.req.param('id')
    const { page = 0, sortBy = 'popularity', sortOrder = 'desc' } = ctx.req.valid('query')

    const albums = await getArtistAlbums(artistId, { page, sortBy, sortOrder })

    return ctx.json({ success: true as const, data: albums })
  }
)
