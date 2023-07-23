import {
  getAssetFromKV,
  NotFoundError,
  Options,
} from '@cloudflare/kv-asset-handler'
import { toByteArray } from 'base64-js'
import { createCors, error, json, Router } from 'itty-router'
import {
  getServers,
  getServersIcons,
  getStats,
  getRecentStats,
  putServers,
  putServerIcons,
  ServerIcons,
} from './storage'
import { handleScheduled } from './cron'
import { fallbackIcon } from './icons'

import manifestJSON from '__STATIC_CONTENT_MANIFEST'

export interface Env {
  GLOBAL_CHART_PING_INTERVAL: number
  GLOBAL_CHART_DELETE_AFTER_DAYS: number
  RECENT_CHARTS_DELETE_AFTER_MINUTES: number
  WEBHOOK_URL?: string
  SERVERS_EDIT_TOKEN?: string
  PING_ALIASES?: string
  PING_ATTEMPTS?: number
  STATUS_URL?: string
  BEDROCK_STATUS_URL?: string
  KV_SERVERS: KVNamespace
  __STATIC_CONTENT: string
}

const assetManifest = JSON.parse(manifestJSON)
const { corsify, preflight } = createCors()
const router = Router()

router
  .all('*', preflight)
  .get('/api/servers', async (request, env) => json(await getServers(env)))
  .get('/api/servers/stats', async (request, env) => json(await getStats(env)))
  .get('/api/servers/stats/recent', async (request, env) =>
    json(await getRecentStats(env)),
  )
  .get('/api/servers/:id/favicon', ({ params }, env) =>
    params.id ? handleFavicon(env, params.id) : error(404),
  )
  .post('/api/servers/icons', handleFaviconUpload)
  .post('/api/servers/update', handleUpdateRequest)
  .get('/editor', (request: Request, env, ctx) =>
    fetchAsset(request, env, ctx, {
      mapRequestToAsset: (req) => {
        const url = req.url.replace('/editor', '/index.html')
        return new Request(url, req)
      },
    }),
  )
  .all('*', async (request: Request, env, ctx) => {
    if (request.method !== 'HEAD' && request.method !== 'GET') {
      return error(405, 'Method Not Allowed.')
    }

    try {
      return await fetchAsset(request, env, ctx, {
        cacheControl: (req) => {
          const url = new URL(req.url)
          return url.pathname === '/' ? {} : { browserTTL: 60 * 60 * 24 * 365 }
        },
      })
    } catch (e) {
      return e instanceof NotFoundError
        ? error(404)
        : error(500, `Unable to find asset: ${e}`)
    }
  })

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return router
      .handle(request, env, ctx)
      .catch(async (e: Error) => {
        console.error(e.toString())

        if (env.WEBHOOK_URL) {
          await fetch(env.WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify({
              content: `**CraftStats** An error occurred on ${request.url}: \`${e}\``,
            }),
          })
        }

        return error(500, `Internal server error: ${e}`)
      })
      .then(corsify)
  },

  scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduled(env))
  },
}

async function handleFavicon(env: Env, serverId: string) {
  const icons = await getServersIcons(env)
  const base64icon = icons[serverId]

  if (!base64icon) {
    return new Response(fallbackIcon, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'max-age=600', // 10 min
      },
    })
  }

  // Remove 'data:image/png;base64,' from favicon
  return new Response(toByteArray(base64icon.substring(22)), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'max-age=86400', // 1 day
    },
  })
}

async function handleUpdateRequest(request: Request, env: Env) {
  if (!request.json) {
    return json({ status: 'invalid_data' })
  }

  const data = await request.json<{ token: string; servers: unknown }>()

  if (!env.SERVERS_EDIT_TOKEN || env.SERVERS_EDIT_TOKEN !== data.token) {
    return json({ status: 'invalid_token' })
  }

  if (!data.servers || !(data.servers instanceof Array)) {
    return json({ status: 'invalid_data' })
  }

  await putServers(env, data.servers)

  return json({ status: 'success' })
}

async function handleFaviconUpload(request: Request, env: Env) {
  const data = await request.json<{ token: string; icons: ServerIcons }>()

  if (!env.SERVERS_EDIT_TOKEN || env.SERVERS_EDIT_TOKEN !== data.token) {
    return json({ status: 'invalid_token' })
  }

  const icons = await getServersIcons(env)

  await putServerIcons(env, Object.assign(icons, data.icons))

  return json({ status: 'success' })
}

function fetchAsset(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  options?: Partial<Options>,
) {
  const event = { request, waitUntil: (p) => ctx.waitUntil(p) } as FetchEvent

  return getAssetFromKV(event as FetchEvent, {
    ...options,
    ASSET_NAMESPACE: env.__STATIC_CONTENT,
    ASSET_MANIFEST: assetManifest,
  })
}
