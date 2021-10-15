declare const KV_SERVERS: KVNamespace

export type ServerIcons = { [serverId: string]: string }
export type RecentServersStats = {
  [serverId: string]: { [date: string]: number }
}

export interface Server {
  id: string
  name: string
  address: string
  icon?: string
  color?: string
  version?: string
}

export interface ServerStats {
  serverId: string
  stats: { [date: string]: DailyServerStats }
}

export interface DailyServerStats {
  [time: string]: number
}

export async function getServers(): Promise<Server[]> {
  return (await KV_SERVERS.get('servers', 'json')) || []
}

export async function getServersStats(): Promise<ServerStats[]> {
  return (await KV_SERVERS.get('servers_stats', 'json')) || []
}

export async function getServersRecentStats(): Promise<RecentServersStats> {
  return (await KV_SERVERS.get('servers_recent_stats', 'json')) || {}
}

export async function getServersIcons(): Promise<ServerIcons> {
  return (await KV_SERVERS.get('servers_icons', 'json')) || {}
}

export function putServers(servers: Server[]): Promise<void> {
  return KV_SERVERS.put('servers', JSON.stringify(servers))
}

export function putServersStats(stats: ServerStats[]): Promise<void> {
  return KV_SERVERS.put('servers_stats', JSON.stringify(stats))
}

export function putServersRecentStats(data: RecentServersStats): Promise<void> {
  return KV_SERVERS.put('servers_recent_stats', JSON.stringify(data))
}

export function putServerIcons(icons: ServerIcons): Promise<void> {
  return KV_SERVERS.put('servers_icons', JSON.stringify(icons))
}
