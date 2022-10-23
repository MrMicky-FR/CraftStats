<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{ error?: string }>()
</script>

<template>
  <div v-if="error" class="alert alert-danger shadow text-center">
    {{ t('error', { error }) }}
  </div>

  <div v-else class="text-center pt-3">
    <div class="spinner-grow mb-3" role="status" />

    <h1>{{ t('loading') }}</h1>
  </div>
</template>
