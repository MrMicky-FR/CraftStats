<script setup lang="ts">
import type { ServerDescription, ServerStats } from '@/api'

import { onMounted, reactive, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchStats } from '@/api'
import { createServersChart } from '@/charts'
import BLoader from '@/components/BLoader.vue'

const { t } = useI18n()
const chart = useTemplateRef('servers-chart')

const loading = ref(true)
const error = ref<string>()
const stats = reactive<ServerStats[]>([])

const props = defineProps<{ servers: ServerDescription[] }>()

onMounted(async () => {
  try {
    stats.push(...(await fetchStats()))

    await createServersChart(chart.value, props.servers, stats, t)

    loading.value = false
  } catch (e) {
    console.log(e)
    error.value = e?.toString()
  }
})
</script>

<template>
  <div class="box mb-4">
    <BLoader v-if="loading" :error />

    <div ref="servers-chart" />
  </div>
</template>
