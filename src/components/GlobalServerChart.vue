<script setup lang="ts">
import type { Chart } from 'highcharts'
import type { ServerDescription } from '@/api'

import { onMounted, onUnmounted, ref, shallowRef, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchStats } from '@/api'
import { createServersChart } from '@/charts'
import BLoader from '@/components/BLoader.vue'

const { t } = useI18n()
const chart = useTemplateRef('servers-chart')

const chartInstance = shallowRef<Chart>()
const loading = ref(true)
const mounted = ref(false)
const error = ref<unknown>()

const props = defineProps<{ servers: ServerDescription[] }>()

onMounted(async () => {
  mounted.value = true

  try {
    const stats = await fetchStats()
    const instance = await createServersChart(chart.value, props.servers, stats, t)

    if (!mounted.value) {
      // Destroy chart if component was unmounted during awaiting before assignment
      instance?.destroy()
      return
    }

    chartInstance.value = instance
  } catch (e) {
    console.error(e)
    error.value = e
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  mounted.value = false
  chartInstance.value?.destroy()
  chartInstance.value = undefined
})
</script>

<template>
  <div class="box mb-4">
    <BLoader v-if="loading || error" :error />

    <div ref="servers-chart" />
  </div>
</template>
