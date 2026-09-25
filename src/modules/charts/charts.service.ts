import { z } from '@hono/zod-openapi'
import { JioSaavnEndpoint } from '#lib/constants'
import { fetchJioSaavn } from '#lib/http'
import { parseUpstream } from '#lib/validate'
import { ChartRawSchema, toChart, type ChartSchema } from './charts.schema'

export async function getCharts(): Promise<z.infer<typeof ChartSchema>[]> {
  const { data } = await fetchJioSaavn<unknown[]>({ call: JioSaavnEndpoint.charts, params: {} })
  const charts = parseUpstream(z.array(ChartRawSchema), data, JioSaavnEndpoint.charts)

  return charts.map(toChart)
}
