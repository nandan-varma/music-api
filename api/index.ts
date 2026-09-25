import { handle } from '@hono/node-server/vercel'
import { createApp } from '../src/app'

export default handle(createApp())
