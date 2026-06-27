import { fetcher } from 'itty-fetcher'

export type ServerIcons = Record<string, string>
export type PlayerCountTimeSeries = Record<string, Record<string, number>>

export interface ServerDescription {
  id: string
  name: string
  type: 'JAVA' | 'BEDROCK'
  address: string
  color: string
  version?: string
  website?: string
}

export interface ServerStats {
  serverId: string
  record?: { players: number; date: string }
  stats: PlayerCountTimeSeries
}

export const apiBaseUrl = `${window.location.origin}/api`

const client = fetcher({ base: apiBaseUrl })

export function fetchServers() {
  return client.get<ServerDescription[]>('/servers')
}

export function fetchStats() {
  return client.get<ServerStats[]>('/servers/stats')
}

export function fetchRecentStats() {
  return client.get<PlayerCountTimeSeries>('/servers/stats/recent')
}

export function saveServers(token: string, servers: ServerDescription[], icons: ServerIcons) {
  const params = { servers, icons }

  return client.post<unknown, Record<string, string>>('/servers', params, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function encodeFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

export function sortServers(servers: ServerDescription[], serverStats: PlayerCountTimeSeries) {
  return servers
    .map((server): [ServerDescription, number] => {
      const stats = serverStats[server.id] || {}
      const latest = Object.keys(stats).reduce((a, b) => (a > b ? a : b), '')

      return [server, stats[latest] ?? -1]
    })
    .sort(([, playersA], [, playersB]) => playersB - playersA)
    .map(([server]) => server)
}
