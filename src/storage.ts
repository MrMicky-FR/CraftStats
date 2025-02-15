export type ServerIcons = { [serverId: string]: string }
export type RecentServersStats = {
  [serverId: string]: { [date: string]: number }
}

export interface Server {
  id: string
  name: string
  type?: 'JAVA' | 'BEDROCK'
  address: string
  color?: string
  version?: string
}

export interface ServerStats {
  serverId: string
  record?: { players: number; date: string }
  stats: { [date: string]: DailyServerStats }
}

export interface DailyServerStats {
  [time: string]: number
}

export async function getServers(env: Env): Promise<Server[]> {
  return (await env.KV_SERVERS.get('servers', 'json')) || []
}

export async function getStats(env: Env): Promise<ServerStats[]> {
  return (await env.KV_SERVERS.get('servers_stats', 'json')) || []
}

export async function getRecentStats(env: Env): Promise<RecentServersStats> {
  return (await env.KV_SERVERS.get('servers_recent_stats', 'json')) || {}
}

export async function getServersIcons(env: Env): Promise<ServerIcons> {
  return (await env.KV_SERVERS.get('servers_icons', 'json')) || {}
}

export function putServers(env: Env, servers: Server[]) {
  return env.KV_SERVERS.put('servers', JSON.stringify(servers))
}

export function putServersStats(env: Env, stats: ServerStats[]) {
  return env.KV_SERVERS.put('servers_stats', JSON.stringify(stats))
}

export function putRecentStats(env: Env, data: RecentServersStats) {
  return env.KV_SERVERS.put('servers_recent_stats', JSON.stringify(data))
}

export function putServerIcons(env: Env, icons: ServerIcons) {
  return env.KV_SERVERS.put('servers_icons', JSON.stringify(icons))
}
