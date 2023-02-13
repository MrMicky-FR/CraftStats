import type { SeriesSplineOptions } from 'highcharts'
import type { ServerDescription, ServerStats } from './api'

import Highcharts from 'highcharts'

const COLOR_CLASS_PREFIX = 'chart-color-'

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
      renderTo: 'server-chart-' + server.id,
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

  const serverDescriptions = servers.reduce((all, server) => {
    return { ...all, [server.id]: server }
  }, {} as { [serverId: string]: ServerDescription })

  const series = stats
    .map((value): SeriesSplineOptions => {
      const server = serverDescriptions[value.serverId]
      const data = mapServerStats(value)

      if (!server) {
        return { type: 'spline' }
      }

      return {
        name: server.name,
        color: server.color,
        className: COLOR_CLASS_PREFIX + server.color,
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
    .filter((value) => value.data && value.data.length)

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

  document
    .querySelectorAll<HTMLElement>(`[class*=${COLOR_CLASS_PREFIX}]`)
    .forEach((el) =>
      el.classList.forEach((cssClass) => {
        if (cssClass.startsWith(COLOR_CLASS_PREFIX)) {
          el.style.fill = cssClass.substring(COLOR_CLASS_PREFIX.length)
          el.style.stroke = cssClass.substring(COLOR_CLASS_PREFIX.length)
        }
      }),
    )
}
