import { Server } from './storage'

export interface PingResult {
  onlinePlayers: number
  maxPlayers: number
  favicon?: string
}

export async function ping(server: Server): Promise<PingResult | null> {
  const host = server.address
  const response = await fetch(`https://eu.mc-api.net/v3/server/ping/${host}`, {
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

  if (!json.status || !json.online) {
    console.log(
      `Server is not online (status=${json.status}, online=${json.online})`,
    )
    return null
  }

  return {
    onlinePlayers: json.players.online,
    maxPlayers: json.players.max,
    favicon: json.favicon_base64,
  }
}
