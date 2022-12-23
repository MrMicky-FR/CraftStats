import { DateTime } from 'luxon'
import { error } from 'itty-router-extras'
import { Env } from './index'
import { ping } from './pinger'
import {
  getServers,
  getServersIcons,
  getRecentStats,
  getStats,
  putServerIcons,
  putRecentStats,
  putServersStats,
  Server,
  ServerStats,
} from './storage'

export async function handleScheduled(env: Env): Promise<Response> {
  try {
    await pingServers(env)

    return new Response('OK')
  } catch (e) {
    console.error(`Error during servers ping: ${e}`)

    if (env.WEBHOOK_URL) {
      await fetch(env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({
          content: `**CraftStats** An error occurred on cron: \`${e}\``,
        }),
      })
    }

    return error(500, `Internal server error: ${e}`)
  }
}

async function pingServers(env: Env): Promise<void> {
  const now = DateTime.now().set({ millisecond: 0 })
  const archiveStats = now.minute % env.GLOBAL_CHART_PING_INTERVAL == 0
  const playersCounts: { [serverId: string]: number } = {}
  let updateServerIcons = false

  const servers = await getServers(env)
  const serverIcons = await getServersIcons(env)

  // Ping all servers
  for (const server of servers) {
    try {
      const result = await ping(env, server)

      if (!result) {
        playersCounts[server.id] = -1
        continue
      }

      const favicon = result.favicon
      playersCounts[server.id] = result.onlinePlayers

      if (archiveStats && favicon && favicon !== serverIcons[server.id]) {
        serverIcons[server.id] = favicon
        updateServerIcons = true
      }
    } catch (e) {
      playersCounts[server.id] = -1
      console.log(`Unable to ping ${server.address}: ${e}`)
    }
  }

  await updateRecentStats(env, servers, playersCounts, now)

  if (archiveStats) {
    await updateStats(env, servers, playersCounts, now)
  }

  if (updateServerIcons) {
    await putServerIcons(env, serverIcons)
  }
}

async function updateRecentStats(
  env: Env,
  servers: Server[],
  playersCounts: Record<string, number>,
  now: DateTime,
) {
  const isoDateTime = now.toISO({ suppressMilliseconds: true })
  const deleteOlder = now.minus({
    minutes: env.RECENT_CHARTS_DELETE_AFTER_MINUTES,
  })
  const recentStats = await getRecentStats(env)

  for (const server of servers) {
    const stats = recentStats[server.id] || {}

    Object.keys(stats)
      .filter((date) => DateTime.fromISO(date) < deleteOlder)
      .forEach((date) => delete stats[date])

    stats[isoDateTime] = playersCounts[server.id]

    recentStats[server.id] = stats
  }

  await putRecentStats(env, recentStats)
}

async function updateStats(
  env: Env,
  servers: Server[],
  playersCounts: Record<string, number>,
  now: DateTime,
) {
  const currentDate = now.toISODate()
  const currentTime = now.toFormat('HH:mm')
  const serverStats = await getStats(env)

  // Add new servers in stats
  for (const server of servers) {
    if (!serverStats.find((value) => value.serverId === server.id)) {
      serverStats.push({ serverId: server.id, stats: {} })
    }
  }

  for (const stats of serverStats) {
    const players = playersCounts[stats.serverId]
    const dailyStats = stats.stats[currentDate]

    if (players === undefined) {
      continue
    }

    if (players > (stats.record?.players || 0)) {
      stats.record = { players, date: now.toISO() }
    }

    if (!dailyStats) {
      stats.stats[currentDate] = {}
    }

    stats.stats[currentDate][currentTime] = players
  }

  await putServersStats(env, deleteOldStats(env, serverStats, now))
}

function deleteOldStats(env: Env, stats: ServerStats[], now: DateTime) {
  // Clear old stats at 4 am
  if (now.hour !== 4 || now.minute !== 0) {
    return stats
  }

  // Delete values older than a year
  const deleteOlder = now.minus({ days: env.GLOBAL_CHART_DELETE_AFTER_DAYS })

  for (const server of stats) {
    Object.keys(server.stats)
      .filter((date) => DateTime.fromISO(date) < deleteOlder)
      .forEach((date) => delete server.stats[date])
  }

  console.log('Old stats have been deleted.')

  return stats
}
