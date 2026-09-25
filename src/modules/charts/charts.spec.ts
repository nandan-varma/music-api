import { describe, expect, it } from 'vitest'
import { chartsApp } from './charts.routes.js'
import { ChartSchema } from './charts.schema.js'

describe('charts routes', () => {
  it('retrieves the list of charts', async () => {
    const response = await chartsApp.request('/charts')

    const { data } = (await response.json()) as { data: unknown[] }
    expect(() => ChartSchema.array().parse(data)).not.toThrow()
    expect(data.length).toBeGreaterThan(0)
  })
})
