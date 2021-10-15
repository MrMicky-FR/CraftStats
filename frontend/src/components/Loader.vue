<template>
  <div v-if="error" class="alert alert-danger shadow text-center">
    {{ $t('error', { error }) }}
  </div>

  <div v-else class="text-center pt-3">
    <div class="spinner-grow mb-3" role="status" />

    <h1>{{ $t('loading') }}</h1>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Loader',
  props: {
    error: String,
  },
})
</script>
