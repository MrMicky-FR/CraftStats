import type { Server, ServerStats } from './storage'

import { ping } from './pinger'
import {
  getRecentStats,
  getServers,
  getServersIcons,
  getStats,
  putRecentStats,
  putServerIcons,
  putServersStats,
} from './storage'
import { subDays, subMinutes } from './utils/dates'

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

    return new Response(`Internal server error: ${e}`, { status: 500 })
  }
}

async function pingServers(env: Env): Promise<void> {
  const now = new Date()
  const archive = now.getMinutes() % env.GLOBAL_PING_INTERVAL === 0
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
      playersCounts[server.id] = result.players.online

      if (archive && favicon && favicon !== serverIcons[server.id]) {
        serverIcons[server.id] = favicon
        updateServerIcons = true

        console.log(`Updated favicon for ${server.address}`)
      }
    } catch (e) {
      playersCounts[server.id] = -1
      console.warn(`Unable to ping ${server.address}: ${e}`)
    }
  }

  await updateRecentStats(env, servers, playersCounts, now)

  if (archive) {
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
  now: Date,
) {
  const isoDateTime = now.toISOString().slice(0, 19) + 'Z' // Remove milliseconds
  const deleteDate = subMinutes(now, env.RECENT_DELETE_AFTER_MIN).getTime()
  const recentStats = await getRecentStats(env)

  for (const server of servers) {
    const stats = recentStats[server.id] || {}

    Object.keys(stats)
      .filter((date) => Date.parse(date) < deleteDate)
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
  now: Date,
) {
  const currentDateTime = now.toISOString()
  const currentDate = currentDateTime.slice(0, 10) // YYYY-MM-DD
  const currentTime = now.toTimeString().slice(0, 5) // HH:mm
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
      stats.record = { players, date: currentDateTime }
    }

    if (!dailyStats) {
      stats.stats[currentDate] = {}
    }

    stats.stats[currentDate][currentTime] = players
  }

  await putServersStats(env, purgeStats(env, servers, serverStats, now))
}

function purgeStats(env: Env, serv: Server[], stats: ServerStats[], now: Date) {
  // Clear old stats at 4 am
  if (now.getHours() !== 4 || now.getMinutes() !== 0) {
    return stats
  }

  const deleteDate = subDays(now, env.GLOBAL_DELETE_AFTER_DAYS).getTime()

  for (const server of stats) {
    Object.keys(server.stats)
      .filter((date) => Date.parse(date) < deleteDate)
      .forEach((date) => delete server.stats[date])
  }

  console.log('Old stats have been deleted.')

  // Purge stats for deleted servers
  return stats.filter((server) => serv.find((s) => s.id === server.serverId))
}
