<template>
  <nav class="navbar navbar-expand-lg navbar-light mt-3 mb-3">
    <a class="navbar-brand me-auto fs-3" href="#">CraftStats</a>

    <VButton @click="toggleServersChart">
      {{ $t(showServersChart ? 'hide' : 'show') }}
    </VButton>
  </nav>

  <Loader v-if="loading" :error="error" />

  <div v-else class="mb-4">
    <div v-if="enableServersChart" v-show="showServersChart">
      <ServersChart :servers="servers" :servers-stats="stats" />
    </div>

    <div class="row gx-xl-4 gy-4">
      <div v-for="(server, i) in servers" :key="server.id" class="col-lg-6">
        <Server
          :description="server"
          :stats="serverStats[server.id]"
          :position="i + 1"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import {
  fetchRecentStats,
  fetchServers,
  RecentServersStats,
  ServerDescription,
} from '@/api'
import Server from '@/components/Server.vue'
import ServersChart from '@/components/ServersChart.vue'
import Loader from '@/components/Loader.vue'
import VButton from '@/components/VButton.vue'

export default defineComponent({
  name: 'ServersList',
  components: { Loader, VButton, ServersChart, Server },
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
      this.error = e.toString()
    }
  },
  data() {
    return {
      error: null,
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
