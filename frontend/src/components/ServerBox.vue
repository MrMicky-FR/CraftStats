<script setup lang="ts">
import type { ServerDescription } from '@/api'

import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiBaseUrl } from '@/api'
import { createSingleServerChart } from '@/charts'

const { t } = useI18n()
const props = defineProps<{
  position: number
  description: ServerDescription
  stats: Record<string, number>
}>()

const favicon = computed(
  () => `${apiBaseUrl}/servers/${props.description.id}/favicon`,
)
const playersCount = computed(() => {
  const values = Object.values(props.stats)

  return values.length ? values[values.length - 1] : -1
})

onMounted(() => createSingleServerChart(props.description, props.stats))
</script>

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
          {{ t('playersCount', playersCount) }}
        </p>

        <p v-else class="text-danger mb-0">{{ $t('offline') }}</p>
      </div>

      <div class="col-sm col-12">
        <div :id="'server-chart-' + description.id" class="h-100" />
      </div>
    </div>
  </div>
</template>
