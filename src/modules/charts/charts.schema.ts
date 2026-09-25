import { z } from '@hono/zod-openapi'
import { imageLinks } from '#lib/codecs'
import { LinkSchema } from '#schemas/common'

/** Charts are just curated playlists — fetch their contents with `GET /playlists?id={id}`. */
export const ChartRawSchema = z.object({
  id: z.string(),
  title: z.string(),
  image: z.string(),
  type: z.string(),
  count: z.number().nullable().default(null),
  perma_url: z.string(),
  language: z.string().nullable().default(null)
})

export const ChartSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    image: z.array(LinkSchema),
    type: z.string(),
    songCount: z.number().nullable(),
    url: z.string(),
    language: z.string().nullable()
  })
  .openapi('Chart')

export const toChart = (chart: z.infer<typeof ChartRawSchema>): z.infer<typeof ChartSchema> => ({
  id: chart.id,
  name: chart.title,
  image: imageLinks(chart.image),
  type: chart.type,
  songCount: chart.count,
  url: chart.perma_url,
  language: chart.language
})
