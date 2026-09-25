import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ChartSchema } from './charts.schema'
import { getCharts } from './charts.service'

export const chartsApp = new OpenAPIHono()

chartsApp.openapi(
  createRoute({
    method: 'get',
    path: '/charts',
    tags: ['Charts'],
    summary: 'Retrieve editorial charts',
    description:
      'Retrieve JioSaavn\'s editorial charts (e.g. "India Superhits Top 50"). Charts are playlists — ' +
      "fetch a chart's songs with `GET /playlists?id={id}` using the returned ID.",
    operationId: 'getCharts',
    responses: {
      200: {
        description: 'Successful response with the list of charts',
        content: {
          'application/json': {
            schema: z.object({ success: z.boolean().openapi({ example: true }), data: z.array(ChartSchema) })
          }
        }
      }
    }
  }),
  async (ctx) => {
    const charts = await getCharts()
    return ctx.json({ success: true as const, data: charts })
  }
)
