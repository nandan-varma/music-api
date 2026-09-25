import { handle } from '@hono/node-server/vercel'
import { createApp } from '../src/app.js'

export default handle(createApp())
