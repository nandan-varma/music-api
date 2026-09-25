import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { PlaylistSchema } from './playlists.schema.js'
import { getPlaylistById, getPlaylistByLink } from './playlists.service.js'

export const playlistsApp = new OpenAPIHono()

playlistsApp.openapi(
  createRoute({
    method: 'get',
    path: '/playlists',
    tags: ['Playlist'],
    summary: 'Retrieve a playlist by ID or link',
    description: 'Retrieve a playlist by providing either an ID or a direct link to the playlist on JioSaavn.',
    operationId: 'getPlaylistByIdOrLink',
    request: {
      query: z.object({
        id: z.string().optional().openapi({
          title: 'Playlist ID',
          example: '82914609',
          default: '82914609'
        }),
        link: z
          .string()
          .url()
          .optional()
          .transform((value) => {
            const matches = value?.match(
              /(?:jiosaavn\.com|saavn\.com)\/(?:featured|s\/playlist)\/[^/]+\/([^/]+)$|\/([^/]+)$/
            )
            return matches?.filter(Boolean).pop()
          })
          .openapi({
            title: 'Playlist Link',
            description: 'A direct link to the playlist on JioSaavn',
            type: 'string',
            example: 'https://www.jiosaavn.com/featured/its-indie-english/AMoxtXyKHoU_',
            default: 'https://www.jiosaavn.com/featured/its-indie-english/AMoxtXyKHoU_'
          }),
        page: z.string().pipe(z.coerce.number()).optional().openapi({
          title: 'Page Number',
          description: 'The page number of the songs to retrieve from the playlist',
          example: '0',
          default: '0'
        }),
        limit: z.string().pipe(z.coerce.number()).optional().openapi({
          title: 'Limit',
          description: 'Number of songs to retrieve per page',
          example: '10',
          default: '10'
        })
      })
    },
    responses: {
      200: {
        description: 'Successful response with playlist details',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean().openapi({ example: true }),
              data: PlaylistSchema
            })
          }
        }
      },
      400: { description: 'Bad request due to missing or invalid query parameters.' },
      404: { description: 'The playlist could not be found with the provided ID or link.' }
    }
  }),
  async (ctx) => {
    const { id, link, page = 0, limit = 10 } = ctx.req.valid('query')

    if (!link && !id) {
      return ctx.json({ success: false as const, message: 'Either playlist ID or link is required' }, 400)
    }

    const playlist = link ? await getPlaylistByLink(link, { page, limit }) : await getPlaylistById(id!, { page, limit })

    return ctx.json({ success: true as const, data: playlist })
  }
)
