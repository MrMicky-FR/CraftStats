import type { StatusResult } from './protocol/status'
import type { ServerDescription } from './storage'

import { status } from './protocol/status'

interface ApiResponse {
  online: boolean
  players: { online: number; max: number }
  icon?: string
  favicon?: string
}

export async function ping(env: Env, server: ServerDescription, attempts: number = 1) {
  const hostAliases: Record<string, string> = env.PING_ALIASES ? JSON.parse(env.PING_ALIASES) : {}
  const host = hostAliases[server.address] || server.address
  const statusUrl = server.type === 'JAVA' ? env.STATUS_URL : env.BEDROCK_STATUS_URL

  if (!statusUrl && server.type === 'BEDROCK') {
    console.error('You need to define BEDROCK_STATUS_URL for Bedrock servers.')
    return undefined
  }

  for (let i = 1; i <= attempts; i++) {
    try {
      const result = statusUrl ? await fetchStatusFromUrl(statusUrl, host) : await status(host)

      if (!result) {
        console.error(`Ping attempt ${i}/${attempts} failed for ${server.address}.`)
        continue
      }

      return result
    } catch (e) {
      console.error(`Ping attempt ${i}/${attempts} threw for ${server.address}.`, e)
    }
  }

  return undefined
}

async function fetchStatusFromUrl(url: string, host: string) {
  const response = await fetch(url.replace('{address}', encodeURIComponent(host)), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'CraftStats',
    },
  })

  if (!response.ok) {
    throw new Error(`Status endpoint returned HTTP ${response.status} for ${host}.`)
  }

  const data = await response.json<ApiResponse>()

  if (!data.online) {
    return undefined
  }

  return { players: data.players, favicon: data.icon ?? data.favicon } as StatusResult
}
