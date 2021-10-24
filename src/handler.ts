import { getAssetFromKV } from '@cloudflare/kv-asset-handler'
import { toByteArray } from 'base64-js'
import { Router, Request } from 'itty-router'
import { missing, error, json } from 'itty-router-extras'
import {
  getServers,
  getServersIcons,
  getServersStats,
  getServersRecentStats,
  putServers,
} from './storage'
import { fallbackIcon } from './icons'

declare const WEBHOOK_URL: string | undefined
declare const SERVERS_EDIT_TOKEN: string | undefined

const router = Router()
const defaultOptions = {
  headers: { 'Access-Control-Allow-Origin': '*' },
}

router
  .get('/api/servers', async () => json(await getServers(), defaultOptions))
  .get('/api/servers/stats', async () =>
    json(await getServersStats(), defaultOptions),
  )
  .get('/api/servers/stats/recent', async () =>
    json(await getServersRecentStats(), defaultOptions),
  )
  .get('/api/servers/:id/favicon', async ({ params }) =>
    params?.id ? handleFavicon(params.id) : missing(),
  )
  .post('/api/servers/update', handleUpdateRequest)
  .get('/editor', async (request, event) => {
    return await getAssetFromKV(event, {
      mapRequestToAsset: (req) => {
        const url = req.url.replace('/editor', '/index.html')
        return new Request(url, req)
      },
    })
  })
  .all('*', async (request, event: FetchEvent) => {
    try {
      return await getAssetFromKV(event, {
        cacheControl: (req) => {
          const url = new URL(req.url)
          // cache static assets for 1 year
          return url.pathname === '/' ? {} : { browserTTL: 60 * 60 * 24 * 365 }
        },
      })
    } catch (e) {
      return missing()
    }
  })

export function handleRequest(
  request: Request,
  event: FetchEvent,
): Promise<Response> {
  return router.handle(request, event).catch(async (e: Error) => {
    console.error(e.toString())

    if (typeof WEBHOOK_URL === 'string') {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          content: `**CraftStats** An error occurred on ${request.url}: \`${e}\``,
        }),
      })
    }

    return error(500, `Internal server error: ${e}`)
  })
}

async function handleFavicon(serverId: string): Promise<Response> {
  const icons = await getServersIcons()
  const base64icon = icons[serverId]

  if (!base64icon) {
    return new Response(fallbackIcon, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'max-age=900', // 15 min
      },
    })
  }

  // Remove 'data:image/png;base64,' from favicon
  return new Response(toByteArray(base64icon.substr(22)), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'max-age=86400', // 1 day
    },
  })
}

async function handleUpdateRequest(request: Request) {
  if (!request.json) {
    return json({ status: 'invalid_data' }, defaultOptions)
  }

  const data = await request.json()

  if (!SERVERS_EDIT_TOKEN || SERVERS_EDIT_TOKEN !== data.token) {
    return json({ status: 'invalid_token' }, defaultOptions)
  }

  if (!data.servers || !(data.servers instanceof Array)) {
    return json({ status: 'invalid_data' }, defaultOptions)
  }

  await putServers(data.servers)

  return json({ status: 'success' }, defaultOptions)
}
