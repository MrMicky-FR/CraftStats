import { Server } from './storage'

declare const PING_FUNCTION_URL: string | undefined

export interface PingResult {
  onlinePlayers: number
  maxPlayers: number
  favicon?: string
}

export async function ping(server: Server): Promise<PingResult | null> {
  const host = server.address
  const isBedrock = server.type === 'BEDROCK'
  const usePingFunction = typeof PING_FUNCTION_URL === 'string'

  if (!usePingFunction && isBedrock) {
    console.log('Bedrock servers are not supported without ping function.')
    return null
  }

  const baseUrl = usePingFunction
    ? `${PING_FUNCTION_URL}/${isBedrock ? 'ping-bedrock' : 'ping'}/`
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

  const json = await response.json()

  if (!json.status || (!usePingFunction && !json.online)) {
    console.log('Invalid server status for ' + host)
    return null
  }

  if (usePingFunction) {
    return {
      onlinePlayers: json.onlinePlayers,
      maxPlayers: json.maxPlayers,
      favicon: json.favicon,
    }
  }

  return {
    onlinePlayers: json.players.online,
    maxPlayers: json.players.max,
    favicon: json.favicon_base64,
  }
}
