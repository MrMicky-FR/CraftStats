<script setup lang="ts">
import type { RecentServersStats, ServerDescription } from '@/api'

import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchRecentStats, fetchServers, sortServers } from '@/api'
import BLoader from '@/components/BLoader.vue'
import ThemeButton from '@/components/ThemeButton.vue'
import ServerBox from '@/components/ServerBox.vue'
import ServersChart from '@/components/ServersChart.vue'

const { t } = useI18n()

const error = ref<string>()
const loading = ref(true)
const enableServersChart = ref(false)
const showServersChart = ref(false)
const servers = reactive<ServerDescription[]>([])
const stats = reactive<RecentServersStats>({})

onMounted(async () => {
  try {
    const localStats = await fetchRecentStats()

    servers.push(...(await fetchServers()))
    Object.keys(localStats).forEach((key) => (stats[key] = localStats[key]))
    sortServers(servers, stats)

    loading.value = false
  } catch (e) {
    console.log(e)
    error.value = (e as Error).toString()
  }
})

function toggleServersChart() {
  enableServersChart.value = true
  showServersChart.value = !showServersChart.value
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-light mt-3 mb-3">
    <a class="navbar-brand me-auto fs-3" href="#">CraftStats</a>

    <ThemeButton class="me-2 me-md-3" />

    <button @click="toggleServersChart" type="button" class="btn btn-primary">
      {{ t(showServersChart ? 'hide' : 'show') }}
    </button>
  </nav>

  <BLoader v-if="loading" :error="error" />

  <div v-else class="mb-4">
    <transition name="fade">
      <div v-if="enableServersChart" v-show="showServersChart">
        <ServersChart :servers="servers" />
      </div>
    </transition>

    <div class="row gx-xl-4 gy-4">
      <div v-for="(server, i) in servers" :key="server.id" class="col-lg-6">
        <ServerBox
          :description="server"
          :stats="stats[server.id]"
          :position="i + 1"
        />
      </div>
    </div>
  </div>
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
