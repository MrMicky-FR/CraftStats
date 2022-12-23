import type { AxiosResponse } from 'axios'

import axios from 'axios'

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

const client = axios.create({ baseURL: apiBaseUrl })

export async function fetchServers(): Promise<ServerDescription[]> {
  const response = await client.get('/servers')

  return response.data
}

export async function fetchStats(): Promise<ServerStats[]> {
  const response = await client.get('/servers/stats')

  return response.data
}

export async function fetchRecentStats(): Promise<RecentServersStats> {
  const response = await client.get('/servers/stats/recent')

  return response.data
}

export function saveServers(
  token: string,
  servers: ServerDescription[],
): Promise<AxiosResponse<Record<string, string>>> {
  return client.post('/servers/update', JSON.stringify({ token, servers }))
}

export async function uploadServerIcons(
  token: string,
  icons: Record<string, string>,
): Promise<AxiosResponse<Record<string, string>>> {
  return axios.post('/servers/icons', JSON.stringify({ token, icons }))
}

export function encodeFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}
