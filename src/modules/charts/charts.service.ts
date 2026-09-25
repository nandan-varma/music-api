import { z } from '@hono/zod-openapi'
import { JioSaavnEndpoint } from '#lib/constants.js'
import { fetchJioSaavn } from '#lib/http.js'
import { parseUpstream } from '#lib/validate.js'
import { ChartRawSchema, toChart, type ChartSchema } from './charts.schema.js'

export async function getCharts(): Promise<z.infer<typeof ChartSchema>[]> {
  const { data } = await fetchJioSaavn<unknown[]>({ call: JioSaavnEndpoint.charts, params: {} })
  const charts = parseUpstream(z.array(ChartRawSchema), data, JioSaavnEndpoint.charts)

  return charts.map(toChart)
}
