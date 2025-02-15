import type { IRequestStrict } from 'itty-router'
import type { ServerIcons } from './storage'

import { toByteArray } from 'base64-js'
import { Router, cors, error, json } from 'itty-router'
import { handleScheduled } from './cron'
import fallbackIcon from './icons/unknown.svg'
import {
  getRecentStats,
  getServers,
  getServersIcons,
  getStats,
  putServerIcons,
  putServers,
} from './storage'

const { corsify, preflight } = cors()
const router = Router<IRequestStrict, [Env]>()

router
  .all('*', preflight)
  .get('/api/servers', async (_, env) => json(await getServers(env)))
  .get('/api/servers/stats', async (_, env) => json(await getStats(env)))
  .get('/api/servers/stats/recent', async (_, env) => json(await getRecentStats(env)))
  .get('/api/servers/:id/favicon', ({ params }, env) =>
    params.id ? handleFavicon(env, params.id) : error(404),
  )
  .post('/api/servers/icons', handleFaviconUpload)
  .post('/api/servers/update', handleUpdateRequest)
  .all('*', () => error(404))

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return router
      .fetch(request, env)
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
      .then((res: Response) => corsify(res, request))
  },

  scheduled(_: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduled(env))
  },
} satisfies ExportedHandler<Env>

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

  if (!data.servers || !Array.isArray(data.servers)) {
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
