import Highcharts from 'highcharts/highstock'
import { SeriesOptionsType } from 'highcharts'
import { ServerDescription, ServerStats } from '@/api'

function mapServerStats(stats: ServerStats) {
  return Object.entries(stats.stats).flatMap(([date, dailyStats]) => {
    return Object.entries(dailyStats)
      .filter(([, count]) => count >= 0)
      .map(([time, count]) => {
        // TODO remove old data support
        return [Date.parse(`${date}T${time.substring(0, 5)}:00.000Z`), count]
      })
  })
}

export function createIndividualServerChart(
  server: ServerDescription,
  stats: Record<string, number>,
): void {
  const data = Object.entries(stats).map(([date, count]) => {
    return [Date.parse(date), count]
  })

  if (!data.length) {
    return
  }

  new Highcharts.Chart({
    chart: {
      renderTo: 'server-chart-' + server.id,
      type: 'spline',
      animation: true,
      spacingLeft: 0,
      spacingBottom: 0,
    },
    title: undefined,
    xAxis: {
      type: 'datetime',
    },
    yAxis: {
      title: undefined,
      floor: 0,
    },
    tooltip: {
      xDateFormat: '%H:%M:%S',
    },
    time: {
      timezoneOffset: new Date().getTimezoneOffset(),
    },
    responsive: {
      rules: [
        {
          condition: {
            callback() {
              return window.innerWidth <= 576
            },
          },
          chartOptions: {
            chart: {
              height: 150,
            },
          },
        },
      ],
    },
    legend: {
      enabled: false,
    },
    exporting: {
      enabled: false,
    },
    credits: {
      enabled: false,
    },
    series: [
      {
        name: 'Players',
        marker: {
          enabled: false,
        },
        data,
      },
    ] as SeriesOptionsType[],
  })
}

export function createServersChart(
  servers: ServerDescription[],
  stats: ServerStats[],
): void {
  const serverDescriptions = servers.reduce((all, server) => {
    return {
      ...all,
      [server.id]: server,
    }
  }, {} as { [serverId: string]: ServerDescription })

  const series = stats
    .map((value) => {
      const server = serverDescriptions[value.serverId]
      const data = mapServerStats(value)

      if (!server) {
        return null
      }

      return {
        name: server.name,
        color: server.color,
        data: data,
      }
    })
    .filter((value) => value && value.data.length)

  Highcharts.stockChart('servers-chart', {
    chart: {
      type: 'spline',
      zoomType: 'x',
    },
    rangeSelector: {
      buttons: [
        {
          type: 'day',
          count: 1,
          text: '1d',
        },
        {
          type: 'day',
          count: 7,
          text: '7d',
        },
        {
          type: 'month',
          count: 1,
          text: '1m',
        },
        {
          type: 'all',
          text: 'All',
        },
      ],
      selected: 1,
    },
    yAxis: {
      opposite: true,
      floor: 0,
    },
    tooltip: {
      split: false,
      shared: true,
    },
    time: {
      timezoneOffset: new Date().getTimezoneOffset(),
    },
    legend: {
      enabled: true,
    },
    exporting: {
      enabled: false,
    },
    series: series as SeriesOptionsType[],
  })
}
