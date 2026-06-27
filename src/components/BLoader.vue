<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{ error?: unknown }>()

function parseErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'error' in error && 'status' in error) {
    return `${error.error} (${error.status})`
  }

  return String(error)
}
</script>

<template>
  <div v-if="error" class="alert alert-danger shadow text-center">
    {{ t('error', { error: parseErrorMessage(error) }) }}
  </div>

  <div v-else class="text-center pt-3">
    <div class="spinner-grow mb-3" />

    <h1>{{ t('loading') }}</h1>
  </div>
</template>
