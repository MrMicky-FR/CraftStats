import axios, { AxiosResponse } from 'axios'

export const apiBaseUrl = '/api'

export type RecentServersStats = {
  [serverId: string]: { [timestamp: string]: number }
}

export interface ServerDescription {
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

export async function fetchServers(): Promise<ServerDescription[]> {
  const response = await axios.get(apiBaseUrl + '/servers')

  return response.data
}

export async function fetchStats(): Promise<ServerStats[]> {
  const response = await axios.get(apiBaseUrl + '/servers/stats')

  return response.data
}

export async function fetchRecentStats(): Promise<RecentServersStats> {
  const response = await axios.get(apiBaseUrl + '/servers/stats/recent')

  return response.data
}

export function saveServers(
  token: string,
  servers: ServerDescription[],
): Promise<AxiosResponse<Record<string, string>>> {
  const json = JSON.stringify({
    token,
    servers,
  })

  return axios.post(apiBaseUrl + '/servers/update', json)
}
