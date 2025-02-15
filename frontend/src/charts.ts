import type { SeriesSplineOptions } from 'highcharts'
import type { ServerDescription, ServerStats } from './api'

import Highcharts from 'highcharts'

function mapServerStats(stats: ServerStats) {
  return Object.entries(stats.stats).flatMap(([date, dailyStats]) => {
    return Object.entries(dailyStats)
      .filter(([, count]) => count >= 0)
      .map(([time, count]) => [Date.parse(`${date}T${time}:01.000Z`), count])
  })
}

export function setChartsLocale(locale: string) {
  if (locale === 'en' && !new Date().toLocaleString().endsWith('M')) {
    locale = 'en-GB' // Use 24-hour format if it's the browser format
  }

  Highcharts.setOptions({
    lang: { locale },
  })
}

export function createSingleServerChart(
  element: HTMLElement | null,
  stats: Record<string, number>,
  dataLabel: string,
) {
  const data = Object.entries(stats).map(([date, count]) => {
    return [Date.parse(date), count]
  })

  if (element === null || !data.length) {
    return
  }

  new Highcharts.Chart({
    chart: {
      renderTo: element,
      type: 'spline',
      animation: true,
      spacingLeft: 0,
      spacingBottom: 0,
      styledMode: true,
    },
    title: undefined,
    xAxis: { type: 'datetime' },
    yAxis: { title: undefined, floor: 0 },
    tooltip: { xDateFormat: '%[HM]' },
    time: { timezone: undefined },
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
        name: dataLabel,
        marker: { enabled: false },
        type: 'spline',
        data,
      },
    ],
  })
}

export async function createServersChart(
  element: HTMLElement | null,
  servers: ServerDescription[],
  stats: ServerStats[],
  translate: (key: string, count?: number) => string,
) {
  if (element === null) {
    return
  }

  await import('highcharts/modules/stock')

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
        },
      }
    })
    .filter((value) => value.data?.length)

  Highcharts.stockChart(element, {
    lang: { rangeSelectorZoom: undefined },
    chart: { type: 'spline', styledMode: true },
    rangeSelector: {
      buttons: [
        { type: 'day', count: 1, text: translate('days', 1) },
        { type: 'day', count: 7, text: translate('days', 7) },
        { type: 'month', count: 1, text: translate('months', 1) },
        { type: 'all', text: translate('all') },
      ],
      selected: 1,
    },
    yAxis: { opposite: true, floor: 0 },
    tooltip: { split: false, shared: true, xDateFormat: '%[YebHM]' },
    time: { timezone: undefined },
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
    return undefined
  }

  for (const stylesheet of document.styleSheets) {
    if (stylesheet.disabled) {
      continue
    }

    const media = stylesheet.media

    if (media.mediaText === '' || media.mediaText.indexOf('screen') !== -1) {
      return stylesheet
    }
  }

  return undefined
}
