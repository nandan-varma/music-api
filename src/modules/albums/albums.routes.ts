import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { AlbumSchema } from './albums.schema'
import { getAlbumById, getAlbumByLink } from './albums.service'

export const albumsApp = new OpenAPIHono()

albumsApp.openapi(
  createRoute({
    method: 'get',
    path: '/albums',
    tags: ['Album'],
    summary: 'Retrieve an album by ID or link',
    description: 'Retrieve an album by providing either an ID or a direct link to the album on JioSaavn.',
    operationId: 'getAlbumByIdOrLink',
    request: {
      query: z.object({
        id: z.string().optional().openapi({
          title: 'Album ID',
          example: '23241654',
          default: '23241654'
        }),
        link: z
          .string()
          .url()
          .optional()
          .transform((value) => value?.match(/jiosaavn\.com\/album\/[^/]+\/([^/]+)$/)?.[1])
          .openapi({
            title: 'Album Link',
            description: 'A direct link to the album on JioSaavn',
            type: 'string',
            example: 'https://www.jiosaavn.com/album/future-nostalgia/ITIyo-GDr7A_',
            default: 'https://www.jiosaavn.com/album/future-nostalgia/ITIyo-GDr7A_'
          })
      })
    },
    responses: {
      200: {
        description: 'Successful response with album details',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean().openapi({ example: true }),
              data: AlbumSchema
            })
          }
        }
      },
      400: { description: 'Bad request due to missing or invalid query parameters.' },
      404: { description: 'The album could not be found with the provided ID or link.' }
    }
  }),
  async (ctx) => {
    const { id, link } = ctx.req.valid('query')

    if (!id && !link) {
      return ctx.json({ success: false as const, message: 'Either album ID or link is required' }, 400)
    }

    const album = link ? await getAlbumByLink(link) : await getAlbumById(id!)

    return ctx.json({ success: true as const, data: album })
  }
)
