<script setup lang="ts">
import type { PlayerCountTimeSeries, ServerDescription } from '@/api.ts'

import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchRecentStats, fetchServers, sortServers } from '@/api.ts'
import { setChartsLocale } from '@/charts.ts'
import BLoader from '@/components/BLoader.vue'
import ServerBox from '@/components/ServerBox.vue'
import GlobalServerChart from '@/components/GlobalServerChart.vue'

const { locale, t } = useI18n()

const error = ref<unknown>()
const loading = ref(true)
const enableServersChart = ref(false)
const showServersChart = ref(false)
const servers = reactive<ServerDescription[]>([])
const stats = reactive<PlayerCountTimeSeries>({})

let refreshTimer: number | undefined

onMounted(async () => {
  setChartsLocale(locale.value)

  try {
    const [localServers, localStats] = await Promise.all([fetchServers(), fetchRecentStats()])

    servers.push(...sortServers(localServers, localStats))
    Object.assign(stats, localStats)

    refreshTimer = setInterval(refreshStats, 60_000) // refresh every minute after initial load
  } catch (e) {
    console.error(e)
    error.value = e
  } finally {
    loading.value = false
  }
})

onUnmounted(() => clearInterval(refreshTimer))

async function refreshStats() {
  try {
    Object.assign(stats, await fetchRecentStats())
  } catch (e) {
    console.warn('Failed to refresh stats', e)
  }
}

function toggleServersChart() {
  enableServersChart.value = true
  showServersChart.value = !showServersChart.value
}
</script>

<template>
  <Teleport v-if="!loading && !error" to="#navbar-stack">
    <button @click="toggleServersChart" type="button" class="btn btn-primary">
      {{ t(showServersChart ? 'hide' : 'show') }}
    </button>
  </Teleport>

  <BLoader v-if="loading || error" :error />

  <main v-else class="mb-4">
    <transition name="fade">
      <div v-if="enableServersChart" v-show="showServersChart">
        <GlobalServerChart :servers />
      </div>
    </transition>

    <div class="row gx-xl-4 gy-4">
      <div v-for="(server, i) in servers" :key="server.id" class="col-lg-6">
        <ServerBox :server :stats="stats[server.id] || {}" :position="i + 1" />
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
