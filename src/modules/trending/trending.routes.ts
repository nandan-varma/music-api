import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { AlbumSchema } from '#modules/albums/albums.schema'
import { PlaylistSchema } from '#modules/playlists/playlists.schema'
import { SongSchema } from '#modules/songs/songs.schema'
import { getTrending } from './trending.service'

export const trendingApp = new OpenAPIHono()

trendingApp.openapi(
  createRoute({
    method: 'get',
    path: '/trending',
    tags: ['Trending'],
    summary: 'Retrieve trending content',
    description: 'Retrieve currently trending songs, albums, or playlists for a given language.',
    operationId: 'getTrending',
    request: {
      query: z.object({
        type: z.enum(['song', 'album', 'playlist']).default('song').openapi({
          description: 'The kind of trending content to retrieve',
          example: 'song'
        }),
        language: z.string().openapi({
          description:
            'Content language, e.g. "hindi" or "english". Required — JioSaavn returns no results without it.',
          example: 'hindi'
        })
      })
    },
    responses: {
      200: {
        description: 'Successful response with trending content',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean().openapi({ example: true }),
              data: z.union([z.array(SongSchema), z.array(AlbumSchema), z.array(PlaylistSchema)])
            })
          }
        }
      },
      400: { description: 'Bad request when language is missing' }
    }
  }),
  async (ctx) => {
    const { type, language } = ctx.req.valid('query')

    const trending = await getTrending(type, language)

    return ctx.json({ success: true as const, data: trending })
  }
)
