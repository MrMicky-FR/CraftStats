import { fetcher } from 'itty-fetcher'

export type RecentServersStats = {
  [serverId: string]: { [timestamp: string]: number }
}

export interface ServerDescription {
  id: string
  name: string
  type?: 'JAVA' | 'BEDROCK'
  address: string
  color?: string
  version?: string
  website?: string
}

export interface ServerStats {
  serverId: string
  stats: { [date: string]: DailyServerStats }
}

export interface DailyServerStats {
  [time: string]: number
}

export const apiBaseUrl = '/api'

const client = fetcher({ base: apiBaseUrl })

export function fetchServers() {
  return client.get<ServerDescription[]>('/servers')
}

export function fetchStats() {
  return client.get<ServerStats[]>('/servers/stats')
}

export function fetchRecentStats() {
  return client.get<RecentServersStats>('/servers/stats/recent')
}

export function saveServers(token: string, servers: ServerDescription[]) {
  const params = { token, servers }

  return client.post<Record<string, string>>('/servers/update', params)
}

export function saveServerIcons(token: string, icons: Record<string, string>) {
  return client.post<Record<string, string>>('/servers/icons', { token, icons })
}

export function encodeFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export function sortServers(s: ServerDescription[], stats: RecentServersStats) {
  return s.sort((a, b) => {
    const statsA = Object.values(stats[a.id] || {})
    const statsB = Object.values(stats[b.id] || {})
    const playersA = statsA.length ? statsA[statsA.length - 1] : -1
    const playersB = statsB.length ? statsB[statsB.length - 1] : -1

    return playersB - playersA
  })
}
