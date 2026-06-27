import type { IRequestStrict } from 'itty-router'
import type { ServerDescription, ServerIcons } from './storage'

import { toByteArray } from 'base64-js'
import { Router, cors, error, json } from 'itty-router'
import { handleScheduled } from './cron'
import fallbackIcon from './icons/unknown.svg?raw'
import {
  isValidIcon,
  getRecentStats,
  getServers,
  getServerIcons,
  getServerStats,
  putServerIcons,
  putServers,
} from './storage'

const { corsify, preflight } = cors({
  allowHeaders: ['Authorization', 'Content-Type'],
})
const router = Router<IRequestStrict, [Env]>()

router
  .all('*', preflight)
  .get('/editor', (request, env) => {
    const url = new URL(request.url)
    url.pathname = '/'

    return env.ASSETS.fetch(new Request(url, request))
  })
  .get('/api/servers', async (_, env) => json(await getServers(env)))
  .get('/api/servers/stats', async (_, env) => json(await getServerStats(env)))
  .get('/api/servers/stats/recent', async (_, env) => json(await getRecentStats(env)))
  .get('/api/servers/:id/icon', ({ params }, env) => handleIconRequest(env, params.id))
  .post('/api/servers', handleUpdateRequest)
  .all('*', () => error(404))

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return router
      .fetch(request, env)
      .catch(async (e: Error) => {
        console.error(e)

        if (env.WEBHOOK_URL) {
          try {
            await fetch(env.WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: `**CraftStats** An error occurred on \`${request.url}\`: \`${e}\``,
              }),
            })
          } catch (webhookError) {
            console.error('Error while sending error to webhook', webhookError)
          }
        }

        return error(500)
      })
      .then((res: Response) => corsify(res, request))
  },

  scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduled(controller.scheduledTime, env))
  },
} satisfies ExportedHandler<Env>

async function handleIconRequest(env: Env, serverId: string) {
  const icons = await getServerIcons(env)
  const base64Icon = icons[serverId]

  if (!base64Icon) {
    return new Response(fallbackIcon, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=900', // 15 min
      },
    })
  }

  // Remove 'data:image/png;base64,' from icon
  const prefixIndex = base64Icon.indexOf(',')
  return new Response(toByteArray(base64Icon.substring(prefixIndex + 1)), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', // 1 day (revalidate 1 week)
    },
  })
}

async function handleUpdateRequest(request: Request, env: Env) {
  const authorizationHeader = request.headers.get('Authorization')
  const token = authorizationHeader?.match(/^Bearer\s+(.+)$/i)?.[1].trim()

  if (!token || token !== env.SERVERS_EDIT_TOKEN) {
    return error(403, 'invalid_token')
  }

  const data = await request.json<{ servers: ServerDescription[]; icons?: ServerIcons }>()

  if (!isValidServersRequest(data)) {
    return error(400, 'invalid_data')
  }

  const icons = { ...(await getServerIcons(env)), ...data.icons }

  // Purge icons for servers that no longer exist
  for (const id of Object.keys(icons)) {
    if (!data.servers.some((server) => id === server.id)) {
      delete icons[id]
    }
  }

  await putServers(env, data.servers)
  await putServerIcons(env, icons)

  return json({ status: 'success' })
}

function isValidServersRequest(data: { servers: unknown; icons?: unknown }) {
  if (!data || !Array.isArray(data.servers)) {
    return false
  }

  const ids = new Set(data.servers.map((server) => server?.id))

  if (!data.servers.every((server) => isValidServer(server)) || ids.size !== data.servers.length) {
    return false
  }

  if (!data.icons) {
    return true
  }

  if (typeof data.icons !== 'object' || Array.isArray(data.icons)) {
    return false
  }

  return Object.values(data.icons).every((icon) => typeof icon === 'string' && isValidIcon(icon))
}

function isValidServer(server: unknown): server is ServerDescription {
  if (!server || typeof server !== 'object') {
    return false
  }

  const { id, name, address, color, type, website } = server as ServerDescription

  if (!id || !name || !address || (type !== 'JAVA' && type !== 'BEDROCK')) {
    return false
  }

  return /^#[0-9a-f]{6}$/i.test(color) && (!website || /^https?:\/\/.+/i.test(website))
}
