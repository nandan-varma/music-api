import { createApp } from './app.js'

// Bun (`bun run`/`bun dist/server.js`) and Cloudflare Workers (via wrangler.toml) both auto-serve a
// default export that exposes `fetch`, so this file only needs to hand one back — no explicit listen call.
export default createApp()
