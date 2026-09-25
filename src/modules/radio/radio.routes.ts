import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { SongSchema } from '#modules/songs/songs.schema.js'
import { FEATURED_STATIONS, StationSchema } from './radio.schema.js'
import { getFeaturedRadio } from './radio.service.js'

export const radioApp = new OpenAPIHono()

radioApp.openapi(
  createRoute({
    method: 'get',
    path: '/radio/stations',
    tags: ['Radio'],
    summary: 'List known featured radio stations',
    description:
      'Retrieve a curated list of known-good station names/languages to pass to GET /radio/featured. ' +
      'JioSaavn has no endpoint that lists these itself, so this is a hand-picked set rather than the full catalog.',
    operationId: 'getRadioStations',
    responses: {
      200: {
        description: 'Successful response with the list of known stations',
        content: {
          'application/json': {
            schema: z.object({ success: z.boolean().openapi({ example: true }), data: z.array(StationSchema) })
          }
        }
      }
    }
  }),
  (ctx) => ctx.json({ success: true as const, data: [...FEATURED_STATIONS] })
)

radioApp.openapi(
  createRoute({
    method: 'get',
    path: '/radio/featured',
    tags: ['Radio'],
    summary: 'Retrieve songs from a featured radio station',
    description:
      'Retrieve songs from one of JioSaavn\'s editorial radio stations (e.g. "Bollywood Butter", "90s Love"). ' +
      'There is no endpoint to list valid station names — find them from the JioSaavn app or website. ' +
      'A station may currently have nothing queued, in which case this returns an empty list rather than an error.',
    operationId: 'getFeaturedRadio',
    request: {
      query: z.object({
        name: z.string().openapi({ description: 'The editorial station name', example: 'Bollywood Butter' }),
        language: z.string().openapi({ description: 'Content language', example: 'hindi' }),
        limit: z.string().pipe(z.coerce.number()).optional().openapi({ example: '10', default: '10' })
      })
    },
    responses: {
      200: {
        description: 'Successful response with songs from the station',
        content: {
          'application/json': {
            schema: z.object({ success: z.boolean().openapi({ example: true }), data: z.array(SongSchema) })
          }
        }
      },
      400: { description: 'Bad request when name or language is missing' }
    }
  }),
  async (ctx) => {
    const { name, language, limit = 10 } = ctx.req.valid('query')
    const songs = await getFeaturedRadio(name, language, limit)

    return ctx.json({ success: true as const, data: songs })
  }
)
