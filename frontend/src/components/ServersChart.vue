<template>
  <div class="box mb-4">
    <BLoader v-if="loading" :error="error" />

    <div id="servers-chart" />
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue'
import type { ServerDescription, ServerStats } from '@/api'

import { defineComponent } from 'vue'
import { fetchStats } from '@/api'
import { createServersChart } from '@/charts'
import BLoader from '@/components/BLoader.vue'

export default defineComponent({
  name: 'ServersChart',
  components: { BLoader },
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
      this.error = (e as Error).toString()
    }
  },
  props: {
    servers: Object as PropType<ServerDescription[]>,
  },
  data() {
    return {
      loading: true,
      error: undefined as string | undefined,
      stats: [] as ServerStats[],
    }
  },
})
</script>
