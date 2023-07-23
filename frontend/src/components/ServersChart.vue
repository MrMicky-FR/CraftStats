<script setup lang="ts">
import type { ServerDescription, ServerStats } from '@/api'

import { fetchStats } from '@/api'
import { onMounted, reactive, ref } from 'vue'
import { createServersChart } from '@/charts'
import BLoader from '@/components/BLoader.vue'

const loading = ref(true)
const error = ref<string>()
const stats = reactive<ServerStats[]>([])

const props = defineProps<{ servers: ServerDescription[] }>()

onMounted(async () => {
  try {
    stats.push(...(await fetchStats()))
    await createServersChart(props.servers, stats)

    loading.value = false
  } catch (e) {
    console.log(e)
    error.value = e?.toString()
  }
})
</script>

<template>
  <div class="box mb-4">
    <BLoader v-if="loading" :error="error" />

    <div id="servers-chart" />
  </div>
</template>
