import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { LyricsSchema, SongSchema } from './songs.schema'
import { getSongByLink, getSongLyrics, getSongsByIds, getSongSuggestions } from './songs.service'

export const songsApp = new OpenAPIHono()

songsApp.openapi(
  createRoute({
    method: 'get',
    path: '/songs',
    tags: ['Songs'],
    summary: 'Retrieve songs by ID or link',
    description: 'Retrieve songs by a comma-separated list of IDs or by a direct link to the song on JioSaavn.',
    operationId: 'getSongByIdsOrLink',
    request: {
      query: z.object({
        ids: z.string().optional().openapi({
          title: 'Song IDs',
          description: 'Comma-separated list of song IDs',
          example: '3IoDK8qI,4IoDK8qI,5IoDK8qI'
        }),
        link: z
          .string()
          .url()
          .optional()
          .transform((value) => value?.match(/jiosaavn\.com\/song\/[^/]+\/([^/]+)$/)?.[1])
          .openapi({
            title: 'Song Link',
            description: 'A direct link to the song on JioSaavn',
            type: 'string',
            example: 'https://www.jiosaavn.com/song/houdini/OgwhbhtDRwM'
          })
      })
    },
    responses: {
      200: {
        description: 'Successful response with song details',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean().openapi({ example: true }),
              data: z.array(SongSchema).openapi({ description: 'Array of song details' })
            })
          }
        }
      },
      400: { description: 'Bad request when query parameters are missing or invalid' },
      404: { description: 'Song not found with the given ID or link' }
    }
  }),
  async (ctx) => {
    const { link, ids } = ctx.req.valid('query')

    if (!link && !ids) {
      return ctx.json({ success: false as const, message: 'Either song IDs or link is required' }, 400)
    }

    const songs = link ? await getSongByLink(link) : await getSongsByIds(ids!)

    return ctx.json({ success: true as const, data: songs })
  }
)

songsApp.openapi(
  createRoute({
    method: 'get',
    path: '/songs/{id}',
    tags: ['Songs'],
    summary: 'Retrieve song by ID',
    description: 'Retrieve a song by its ID.',
    operationId: 'getSongById',
    request: {
      params: z.object({
        id: z.string().openapi({ title: 'Song ID', example: '3IoDK8qI' })
      })
    },
    responses: {
      200: {
        description: 'Successful response with song details',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean().openapi({ example: true }),
              data: z.array(SongSchema)
            })
          }
        }
      },
      404: { description: 'Song not found for the given ID' }
    }
  }),
  async (ctx) => {
    const songId = ctx.req.param('id')
    const songs = await getSongsByIds(songId)

    return ctx.json({ success: true as const, data: songs })
  }
)

songsApp.openapi(
  createRoute({
    method: 'get',
    path: '/songs/{id}/suggestions',
    tags: ['Songs'],
    summary: 'Retrieve song suggestions',
    description:
      'Retrieve song suggestions based on the given song ID. This can be used to get similar songs to the one provided for infinite playback.',
    operationId: 'getSongSuggestions',
    request: {
      params: z.object({
        id: z.string().openapi({ description: 'ID of the song to retrieve suggestions for', example: 'yDeAS8Eh' })
      }),
      query: z.object({
        limit: z.string().pipe(z.coerce.number()).optional().openapi({
          description: 'Limit the number of suggestions to retrieve',
          example: '10',
          default: '10'
        })
      })
    },
    responses: {
      200: {
        description: 'Successful response with song suggestions',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean().openapi({ example: true }),
              data: z.array(SongSchema)
            })
          }
        }
      },
      404: { description: 'No suggestions found for the given song' }
    }
  }),
  async (ctx) => {
    const songId = ctx.req.param('id')
    const { limit } = ctx.req.valid('query')

    const suggestions = await getSongSuggestions(songId, limit ?? 10)

    return ctx.json({ success: true as const, data: suggestions })
  }
)

songsApp.openapi(
  createRoute({
    method: 'get',
    path: '/songs/{id}/lyrics',
    tags: ['Songs'],
    summary: 'Retrieve song lyrics',
    description: 'Retrieve lyrics for a song by its ID. Not every song has lyrics available.',
    operationId: 'getSongLyrics',
    request: {
      params: z.object({
        id: z.string().openapi({ description: 'ID of the song to retrieve lyrics for', example: 'aRZbUYD7' })
      })
    },
    responses: {
      200: {
        description: 'Successful response with song lyrics',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean().openapi({ example: true }),
              data: LyricsSchema
            })
          }
        }
      },
      404: { description: 'Lyrics not found for the given song' }
    }
  }),
  async (ctx) => {
    const songId = ctx.req.param('id')
    const lyrics = await getSongLyrics(songId)

    return ctx.json({ success: true as const, data: lyrics })
  }
)
