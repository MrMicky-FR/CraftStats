import { DateTime } from 'luxon'
import { ping } from './pinger'
import {
  getServers,
  getServersIcons,
  getServersRecentStats,
  getServersStats,
  putServerIcons,
  putServersRecentStats,
  putServersStats,
  Server,
  ServerStats,
} from './storage'

declare const WEBHOOK_URL: string | undefined
declare const GLOBAL_CHART_PING_INTERVAL: number
declare const GLOBAL_CHART_DELETE_AFTER_DAYS: number
declare const RECENT_CHARTS_DELETE_AFTER_MINUTES: number

export async function handleScheduled(): Promise<Response> {
  try {
    await pingServers()

    return new Response('OK')
  } catch (e) {
    console.error(e.toString())

    if (typeof WEBHOOK_URL === 'string') {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          content: `**CraftStats** An error occurred on cron: \`${e}\``,
        }),
      })
    }

    return new Response(`Internal server error: ${e}`, {
      status: 500,
    })
  }
}

async function pingServers(): Promise<void> {
  const now = DateTime.now().set({ millisecond: 0 })
  const archiveStats = now.minute % GLOBAL_CHART_PING_INTERVAL == 0
  const playersCounts: { [serverId: string]: number } = {}
  let updateServerIcons = false

  const servers = await getServers()
  const serverIcons = await getServersIcons()

  // Ping all servers
  for (const server of servers) {
    try {
      const result = await ping(server)

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

  await updateRecentStats(servers, playersCounts, now)

  if (archiveStats) {
    await updateStats(servers, playersCounts, now)
  }

  if (updateServerIcons) {
    await putServerIcons(serverIcons)
  }
}

async function updateRecentStats(
  servers: Server[],
  playersCounts: Record<string, number>,
  now: DateTime,
) {
  const isoDateTime = now.toISO({ suppressMilliseconds: true })
  const deleteOlder = now.minus({ minutes: RECENT_CHARTS_DELETE_AFTER_MINUTES })
  const recentStats = await getServersRecentStats()

  for (const server of servers) {
    const stats = recentStats[server.id] || {}

    Object.keys(stats)
      .filter((date) => DateTime.fromISO(date) < deleteOlder)
      .forEach((date) => delete stats[date])

    stats[isoDateTime] = playersCounts[server.id]

    recentStats[server.id] = stats
  }

  await putServersRecentStats(recentStats)
}

async function updateStats(
  servers: Server[],
  playersCounts: Record<string, number>,
  now: DateTime,
) {
  const currentDate = now.toISODate()
  const currentTime = now.toFormat('HH:mm')
  const serverStats = await getServersStats()

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

    if (!dailyStats) {
      stats.stats[currentDate] = {}
    }

    stats.stats[currentDate][currentTime] = players
  }

  await putServersStats(deleteOldStats(serverStats, now))
}

function deleteOldStats(stats: ServerStats[], now: DateTime): ServerStats[] {
  // Clear old stats at 4 am
  if (now.hour !== 4 || now.minute !== 0) {
    return stats
  }

  // Delete values older than a year
  const deleteOlder = now.minus({ days: GLOBAL_CHART_DELETE_AFTER_DAYS })

  for (const server of stats) {
    Object.keys(server.stats)
      .filter((date) => DateTime.fromISO(date) < deleteOlder)
      .forEach((date) => delete server.stats[date])
  }

  console.log('Old stats have been deleted.')

  return stats
}
