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

export async function getServers(env: Env): Promise<ServerDescription[]> {
  return (await env.KV_SERVERS.get('servers', 'json')) ?? []
}

export async function getServerStats(env: Env): Promise<ServerStats[]> {
  return (await env.KV_SERVERS.get('servers_stats', 'json')) ?? []
}

export async function getRecentStats(env: Env): Promise<PlayerCountTimeSeries> {
  return (await env.KV_SERVERS.get('servers_recent_stats', 'json')) ?? {}
}

export async function getServerIcons(env: Env): Promise<ServerIcons> {
  return (await env.KV_SERVERS.get('servers_icons', 'json')) ?? {}
}

export function putServers(env: Env, servers: ServerDescription[]) {
  return env.KV_SERVERS.put('servers', JSON.stringify(servers))
}

export function putServerStats(env: Env, stats: ServerStats[]) {
  return env.KV_SERVERS.put('servers_stats', JSON.stringify(stats))
}

export function putRecentStats(env: Env, data: PlayerCountTimeSeries) {
  return env.KV_SERVERS.put('servers_recent_stats', JSON.stringify(data))
}

export function putServerIcons(env: Env, icons: ServerIcons) {
  return env.KV_SERVERS.put('servers_icons', JSON.stringify(icons))
}

export function isValidIcon(icon: string) {
  return icon.startsWith('data:image/png;base64,') && icon.length <= 150_000
}
