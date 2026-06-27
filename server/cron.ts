import type { ServerDescription, ServerStats } from './storage'

import { ping } from './pinger'
import {
  isValidIcon,
  getRecentStats,
  getServers,
  getServerIcons,
  getServerStats,
  putRecentStats,
  putServerIcons,
  putServerStats,
} from './storage'
import { subDays, subMinutes } from './utils/dates'

export async function handleScheduled(scheduledTime: number, env: Env) {
  try {
    await pingServers(env, new Date(scheduledTime))
  } catch (e) {
    console.error('Error while pinging servers', e)

    if (env.WEBHOOK_URL) {
      try {
        await fetch(env.WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `**CraftStats** An error occurred on cron: \`${e}\``,
          }),
        })
      } catch (webhookError) {
        console.error('Error while sending error to webhook', webhookError)
      }
    }
    throw e
  }
}

async function pingServers(env: Env, now: Date): Promise<void> {
  const globalPingInterval = Number(env.GLOBAL_PING_INTERVAL) || 15
  const pingAttempts = Number(env.PING_ATTEMPTS) || 1

  const shouldArchive = now.getUTCMinutes() % globalPingInterval === 0
  const playerCountByServerId: Record<string, number> = {}
  let iconsChanged = false

  const servers = await getServers(env)
  const serverIcons = await getServerIcons(env)

  for (const server of servers) {
    try {
      const result = await ping(env, server, pingAttempts)

      if (!result) {
        playerCountByServerId[server.id] = -1
        continue
      }

      const favicon = result.favicon
      playerCountByServerId[server.id] = result.players.online

      if (shouldArchive && favicon && favicon !== serverIcons[server.id] && isValidIcon(favicon)) {
        serverIcons[server.id] = favicon
        iconsChanged = true

        console.log(`Updated icon for ${server.address}`)
      }
    } catch (e) {
      playerCountByServerId[server.id] = -1
      console.warn(`Unable to ping ${server.address}: ${e}`)
    }
  }

  await updateRecentStats(env, servers, playerCountByServerId, now)

  if (shouldArchive) {
    await updateStats(env, servers, playerCountByServerId, now)
  }

  if (iconsChanged) {
    await putServerIcons(env, serverIcons)
  }
}

async function updateRecentStats(
  env: Env,
  servers: ServerDescription[],
  playerCounts: Record<string, number>,
  now: Date,
) {
  const recentTimestamp = now.toISOString().slice(0, 19) + 'Z' // Remove milliseconds
  const deleteAfterMinutes = Number(env.RECENT_DELETE_AFTER_MIN) || 15
  const deleteDate = subMinutes(now, deleteAfterMinutes).getTime()
  const serverIds = new Set(servers.map((s) => s.id))
  const recentStats = await getRecentStats(env)

  for (const server of servers) {
    const stats = recentStats[server.id] || {}

    Object.keys(stats)
      .filter((date) => Date.parse(date) < deleteDate)
      .forEach((date) => delete stats[date])

    stats[recentTimestamp] = playerCounts[server.id]

    recentStats[server.id] = stats
  }

  for (const serverId of Object.keys(recentStats)) {
    if (!serverIds.has(serverId)) {
      delete recentStats[serverId]
    }
  }

  await putRecentStats(env, recentStats)
}

async function updateStats(
  env: Env,
  servers: ServerDescription[],
  playerCounts: Record<string, number>,
  now: Date,
) {
  const currentDateTime = now.toISOString()
  const currentDate = currentDateTime.slice(0, 10) // YYYY-MM-DD
  const currentTime = currentDateTime.slice(11, 16) // HH:mm
  const serverStats = await getServerStats(env)

  for (const server of servers) {
    if (!serverStats.some((value) => value.serverId === server.id)) {
      serverStats.push({ serverId: server.id, stats: {} })
    }
  }

  for (const stats of serverStats) {
    const players = playerCounts[stats.serverId]

    if (players === undefined) {
      continue
    }

    if (players > (stats.record?.players ?? -1)) {
      stats.record = { players, date: currentDateTime }
    }

    stats.stats[currentDate] ??= {}
    stats.stats[currentDate][currentTime] = players
  }

  await putServerStats(env, purgeStats(env, servers, serverStats, now))
}

function purgeStats(env: Env, servers: ServerDescription[], stats: ServerStats[], now: Date) {
  const deleteAfterDays = Number(env.GLOBAL_DELETE_AFTER_DAYS) || 120
  const deleteDate = subDays(now, deleteAfterDays).getTime()

  for (const serverStats of stats) {
    Object.keys(serverStats.stats)
      .filter((date) => Date.parse(date) < deleteDate)
      .forEach((date) => delete serverStats.stats[date])
  }

  // Purge stats for deleted servers
  return stats.filter((server) => servers.some((s) => s.id === server.serverId))
}
