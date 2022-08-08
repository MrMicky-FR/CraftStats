<template>
  <nav class="navbar navbar-expand-lg navbar-light mt-3 mb-3">
    <a class="navbar-brand me-auto fs-3" href="#">CraftStats</a>

    <button @click="toggleServersChart" type="button" class="btn btn-primary">
      {{ $t(showServersChart ? 'hide' : 'show') }}
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
          :stats="serverStats[server.id]"
          :position="i + 1"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import type { RecentServersStats, ServerDescription } from '@/api'

import { defineComponent } from 'vue'
import { fetchRecentStats, fetchServers } from '@/api'
import BLoader from '@/components/BLoader.vue'
import ServerBox from '@/components/ServerBox.vue'
import ServersChart from '@/components/ServersChart.vue'

export default defineComponent({
  name: 'ServersList',
  components: { BLoader, ServersChart, ServerBox },
  props: {
    msg: String,
  },
  async mounted() {
    try {
      this.serverList = await fetchServers()
      this.serverStats = await fetchRecentStats()
      this.loading = false
    } catch (e) {
      console.log(e)
      this.error = (e as Error).toString()
    }
  },
  data() {
    return {
      error: undefined as string | undefined,
      loading: true,
      enableServersChart: false,
      showServersChart: false,
      serverList: [] as ServerDescription[],
      serverStats: {} as RecentServersStats,
    }
  },
  computed: {
    servers() {
      const servers = this.serverList

      if (!this.serverStats) {
        return this.serverList
      }

      return servers.sort((a, b) => {
        const statsA = Object.values(this.serverStats[a.id] || {})
        const statsB = Object.values(this.serverStats[b.id] || {})
        const playersA = statsA.length ? statsA[statsA.length - 1] : -1
        const playersB = statsB.length ? statsB[statsB.length - 1] : -1

        return playersB - playersA
      })
    },
  },
  methods: {
    toggleServersChart() {
      this.enableServersChart = true
      this.showServersChart = !this.showServersChart
    },
  },
})
</script>

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
