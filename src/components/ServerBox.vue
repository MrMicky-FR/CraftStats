<script setup lang="ts">
import type { Chart } from 'highcharts'
import type { ServerDescription } from '@/api'

import { computed, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiBaseUrl } from '@/api'
import { createSingleServerChart } from '@/charts'

const { t } = useI18n()
const chart = useTemplateRef('server-chart')
const chartInstance = shallowRef<Chart>()
const props = defineProps<{
  position: number
  server: ServerDescription
  stats: Record<string, number>
}>()

const favicon = computed(() => `${apiBaseUrl}/servers/${props.server.id}/icon`)
const online = computed(
  () => props.stats[Object.keys(props.stats).reduce((a, b) => (a > b ? a : b), '')] ?? -1,
)

watch(
  () => props.stats,
  (stats) => {
    if (!chartInstance.value) {
      return
    }

    const data = Object.entries(stats).map(([date, count]): [number, number | null] => [
      Date.parse(date),
      count >= 0 ? count : null,
    ])

    chartInstance.value.series[0]?.setData(data, true)
    chartInstance.value.reflow()
  },
  { deep: true },
)

onMounted(() => {
  chartInstance.value = createSingleServerChart(chart.value, props.stats, t('players'))
})
onUnmounted(() => {
  chartInstance.value?.destroy()
  chartInstance.value = undefined
})
</script>

<template>
  <div class="box h-100">
    <div class="server row h-100">
      <div class="col-auto">
        <img
          :src="favicon"
          :alt="server.name"
          class="d-block mb-1 rounded"
          height="64"
          width="64"
        />

        <p class="text-center mb-0 text-body-secondary">#{{ position }}</p>
      </div>

      <div class="col-xl-5 col-sm-4 col">
        <h4 class="fw-bold mb-0">
          <a
            v-if="server.website"
            :href="server.website"
            target="_blank"
            rel="noopener noreferrer"
            class="text-body"
          >
            {{ server.name }}
          </a>
          <span v-else>{{ server.name }}</span>
        </h4>

        <p class="mb-0">{{ server.address }}</p>

        <span v-if="server.type === 'BEDROCK'" class="badge bg-secondary">
          MC: Bedrock Edition
        </span>

        <span v-else-if="server.version" class="badge bg-secondary">
          {{ server.version }}
        </span>

        <p v-if="online >= 0" class="mb-0">
          {{ t('online', online) }}
        </p>

        <p v-else class="text-danger mb-0">{{ t('offline') }}</p>
      </div>

      <div class="col-sm col-12">
        <div ref="server-chart" class="h-100" />
      </div>
    </div>
  </div>
</template>
