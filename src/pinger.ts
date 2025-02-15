import type { StatusResult } from './protocol/status'
import type { Server } from './storage'

import { status } from './protocol/status'

interface ApiResponse {
  online: boolean
  players: { online: number; max: number }
  icon?: string
  favicon?: string
}

export async function ping(env: Env, server: Server) {
  const attempts = env.PING_ATTEMPTS ?? 1

  for (let i = 1; i < attempts; i++) {
    const result = await tryPing(env, server)

    if (!result) {
      console.error(`Error during ping attempt ${i} for ${server.name}.`)
      continue
    }

    return result
  }

  return tryPing(env, server)
}

async function tryPing(env: Env, server: Server) {
  const hostAliases = env.PING_ALIASES ? JSON.parse(env.PING_ALIASES) : {}
  const host = hostAliases[server.address] || server.address
  const url = server.type === 'JAVA' ? env.STATUS_URL : env.BEDROCK_STATUS_URL

  if (!url && server.type === 'JAVA') {
    try {
      return status(server.address)
    } catch (e) {
      console.error(`Unable to ping ${host}: ${e?.toString()}`)
      return undefined
    }
  }

  if (!url) {
    console.error('You need to define BEDROCK_STATUS_URL for bedrock servers.')
    return undefined
  }

  const response = await fetch(url.replace('{address}', host), {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'CraftStats',
    },
  })

  if (!response.ok) {
    console.error(`Invalid status response for ${host}: ${response.status}`)
    return undefined
  }

  const data = await response.json<ApiResponse>()

  if (!data.online) {
    console.error(`Server offline for ${host}`)
    return undefined
  }

  return <StatusResult>{ players: data.players, favicon: data.icon || data.favicon }
}
