import { Env } from './index'
import { Server } from './storage'

interface ApiResponse {
  status: boolean
  online: boolean
  players: { online: number; max: number }
  favicon_base64?: string
}

export interface PingResult {
  onlinePlayers: number
  maxPlayers: number
  favicon?: string
}

export async function ping(env: Env, server: Server) {
  const host = server.address
  const isBedrock = server.type === 'BEDROCK'

  if (!env.PING_FUNCTION_URL && isBedrock) {
    console.log('Bedrock servers are not supported without ping function.')
    return null
  }

  const baseUrl = env.PING_FUNCTION_URL
    ? `${env.PING_FUNCTION_URL}/${isBedrock ? 'ping-bedrock' : 'ping'}/`
    : 'https://eu.mc-api.net/v3/server/ping/'
  const response = await fetch(baseUrl + host, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'CraftStats',
    },
  })

  if (!response.ok) {
    console.log(`Invalid status response for ${host}: ${response.status}`)
    return null
  }

  const json = await response.json<ApiResponse & PingResult>()

  if (!json.status || (!env.PING_FUNCTION_URL && !json.online)) {
    console.log('Invalid server status for ' + host)
    return null
  }

  if (env.PING_FUNCTION_URL) {
    return json
  }

  const result: PingResult = {
    onlinePlayers: json.players.online,
    maxPlayers: json.players.max,
    favicon: json.favicon_base64,
  }

  return result
}
