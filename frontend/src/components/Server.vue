<template>
  <div class="box">
    <div class="server row">
      <div class="col-auto">
        <img
          :src="favicon"
          :alt="description.name"
          class="d-block mb-1 rounded"
          height="64"
          width="64"
        />

        <p class="text-center mb-0 text-muted">#{{ position }}</p>
      </div>

      <div class="col-xl-5 col-sm-4 col">
        <h4 class="fw-bold mb-0">{{ description.name }}</h4>

        <p class="mb-0">{{ description.address }}</p>

        <span v-if="description.type === 'BEDROCK'" class="badge bg-secondary">
          MC: Bedrock Edition
        </span>

        <span v-else-if="description.version" class="badge bg-secondary">
          {{ description.version }}
        </span>

        <p v-if="playersCount >= 0" class="mb-0">
          {{ $tc('playersCount', playersCount) }}
        </p>

        <p v-else class="text-danger mb-0">{{ $t('offline') }}</p>
      </div>

      <div class="col-sm col-12">
        <div :id="'server-chart-' + description.id" class="h-100" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { apiBaseUrl, ServerDescription } from '@/api'
import { createIndividualServerChart } from '@/charts'

export default defineComponent({
  name: 'Server',
  props: {
    position: Number,
    players: Number,
    description: Object as PropType<ServerDescription>,
    stats: Object as PropType<Record<string, number>>,
  },
  mounted() {
    if (this.description && this.stats) {
      createIndividualServerChart(this.description, this.stats)
    }
  },
  computed: {
    playersCount() {
      const values = Object.values(this.stats || {})

      return values.length ? values[values.length - 1] : -1
    },
    favicon() {
      if (!this.description) {
        return ''
      }

      return `${apiBaseUrl}/servers/${this.description.id}/favicon`
    },
  },
})
</script>
