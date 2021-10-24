<template>
  <div class="box mb-4">
    <Loader v-if="loading" :error="error" />

    <div id="servers-chart" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { fetchStats, ServerDescription, ServerStats } from '@/api'
import { createServersChart } from '@/charts'
import Loader from '@/components/Loader.vue'

export default defineComponent({
  name: 'ServersChart',
  components: { Loader },
  async mounted() {
    if (!this.servers) {
      return
    }

    try {
      this.stats = await fetchStats()
      this.loading = false

      createServersChart(this.servers, this.stats)
    } catch (e) {
      console.log(e)
      this.error = e.toString()
    }
  },
  props: {
    servers: Object as PropType<ServerDescription[]>,
  },
  data() {
    return {
      loading: true,
      error: '',
      stats: [] as ServerStats[],
    }
  },
})
</script>
