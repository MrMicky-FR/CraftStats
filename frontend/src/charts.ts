import type { SeriesSplineOptions } from 'highcharts'
import type { ServerDescription, ServerStats } from './api'

import Highcharts from 'highcharts'

function mapServerStats(stats: ServerStats) {
  return Object.entries(stats.stats).flatMap(([date, dailyStats]) => {
    return Object.entries(dailyStats)
      .filter(([, count]) => count >= 0)
      .map(([time, count]) => {
        return [Date.parse(`${date}T${time}:01.000Z`), count]
      })
  })
}

export function createSingleServerChart(
  server: ServerDescription,
  stats: Record<string, number>,
) {
  const data = Object.entries(stats).map(([date, count]) => {
    return [Date.parse(date), count]
  })

  if (!data.length) {
    return
  }

  new Highcharts.Chart({
    chart: {
      renderTo: `server-chart-${server.id}`,
      type: 'spline',
      animation: true,
      spacingLeft: 0,
      spacingBottom: 0,
      styledMode: true,
    },
    title: undefined,
    xAxis: { type: 'datetime' },
    yAxis: { title: undefined, floor: 0 },
    tooltip: { xDateFormat: '%H:%M:%S' },
    time: { timezoneOffset: new Date().getTimezoneOffset() },
    responsive: {
      rules: [
        {
          condition: {
            callback() {
              return window.innerWidth <= 576
            },
          },
          chartOptions: {
            chart: { height: 150 },
          },
        },
      ],
    },
    legend: { enabled: false },
    accessibility: { enabled: false },
    exporting: { enabled: false },
    credits: { enabled: false },
    series: [
      {
        name: 'Players',
        marker: { enabled: false },
        type: 'spline',
        data,
      },
    ],
  })
}

export async function createServersChart(
  servers: ServerDescription[],
  stats: ServerStats[],
) {
  const { default: StockModule } = await import('highcharts/modules/stock')
  StockModule(Highcharts)

  const serverDescriptions = servers.reduce<{
    [serverId: string]: ServerDescription
  }>((all, server) => {
    return { ...all, [server.id]: server }
  }, {})
  const colors: string[] = []

  const series = stats
    .map((value, index): SeriesSplineOptions => {
      const server = serverDescriptions[value.serverId]
      const data = mapServerStats(value)

      if (!server) {
        return { type: 'spline' } // Will be filtered out below
      }

      colors[index] = server.color || '#0000ff'

      return {
        name: server.name,
        colorIndex: index + 1,
        type: 'spline',
        data,
        dataGrouping: {
          approximation: 'high',
          dateTimeLabelFormats: {
            second: ['%A, %b %e, %H:%M:%S', '%A, %b %e, %H:%M:%S'],
            minute: ['%A, %b %e, %H:%M', '%A, %b %e, %H:%M'],
          },
        },
      }
    })
    .filter((value) => value.data?.length)

  Highcharts.stockChart('servers-chart', {
    chart: { type: 'spline', styledMode: true },
    rangeSelector: {
      buttons: [
        { type: 'day', count: 1, text: '1d' },
        { type: 'day', count: 7, text: '7d' },
        { type: 'month', count: 1, text: '1m' },
        { type: 'all', text: 'All' },
      ],
      selected: 1,
    },
    yAxis: { opposite: true, floor: 0 },
    tooltip: { split: false, shared: true },
    time: { timezoneOffset: new Date().getTimezoneOffset() },
    accessibility: { enabled: false },
    legend: { enabled: true },
    exporting: { enabled: false },
    series,
  })

  insertCustomClasses(colors)
}

function insertCustomClasses(colors: string[]) {
  const styleSheet = getStyleSheet()

  if (!styleSheet) {
    return
  }

  colors.forEach((color, index) => {
    const rules = `fill: ${color}!important; stroke: ${color}!important;`
    styleSheet.insertRule(`.highcharts-color-${index + 1} { ${rules} }`)
  })
}

function getStyleSheet() {
  if (!document.styleSheets || document.styleSheets.length === 0) {
    return null
  }

  for (let i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].disabled) {
      continue
    }

    const media = document.styleSheets[i].media

    if (media.mediaText === '' || media.mediaText.indexOf('screen') !== -1) {
      return document.styleSheets[i]
    }
  }

  return null
}
