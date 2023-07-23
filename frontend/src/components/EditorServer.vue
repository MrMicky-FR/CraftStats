<script setup lang="ts">
import type { ServerDescription } from '@/api'

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiBaseUrl, encodeFileAsBase64 } from '@/api'

const { t } = useI18n()

const props = defineProps<{ modelValue: ServerDescription; icon?: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', server: ServerDescription): void
  (e: 'update:icon', icon?: string): void
  (e: 'delete', server: ServerDescription): void
}>()

const server = computed({
  get: () => props.modelValue,
  set: (value: ServerDescription) => emit('update:modelValue', value),
})

const pendingIcon = computed({
  get: () => props.icon,
  set: (value?: string) => emit('update:icon', value),
})

async function uploadIcon(event: Event) {
  if (!(event.target instanceof HTMLInputElement) || !event.target.files) {
    return
  }

  const file = event.target.files[0]

  if (file.size > 100_000) {
    alert('Max icon size is 100 KB.')
    return
  }

  pendingIcon.value = await encodeFileAsBase64(file)
}

function currentIcon(server: string) {
  const favicon = `${apiBaseUrl}/servers/${server}/favicon?time=${Date.now()}`

  return pendingIcon.value || favicon
}
</script>

<template>
  <div class="box h-100">
    <div class="row g-3 mb-3">
      <div class="col-sm-8">
        <label :for="'name-' + server.id" class="form-label">
          {{ t('name') }}
        </label>
        <input
          v-model.trim="server.name"
          :id="'name-' + server.id"
          type="text"
          class="form-control"
          placeholder="Hypixel"
          required
        />
      </div>

      <div class="col-sm-4">
        <label :for="'version-' + server.id" class="form-label">
          {{ t('version') }}
        </label>
        <input
          v-if="server.type !== 'BEDROCK'"
          v-model.trim="server.version"
          :id="'version-' + server.id"
          type="text"
          class="form-control"
          placeholder="1.8-1.17"
        />

        <span v-else class="badge bg-secondary">
          Minecraft: Bedrock Edition
        </span>
      </div>

      <div class="col-sm-8">
        <label :for="'address-' + server.id" class="form-label">
          {{ t('address') }}
        </label>
        <input
          v-model.trim="server.address"
          :id="'address-' + server.id"
          type="text"
          class="form-control"
          placeholder="mc.hypixel.net"
          required
        />
      </div>

      <div class="col-sm-4">
        <label :for="'color-' + server.id" class="form-label">
          {{ t('color') }}
        </label>
        <input
          v-model.trim="server.color"
          :id="'color-' + server.id"
          type="color"
          class="form-control form-control-color w-100"
          required
        />
      </div>

      <div v-if="server.type === 'BEDROCK'" class="col-sm-8">
        <label :for="'icon-' + server.id" class="form-label">
          {{ t('icon') }}
        </label>
        <input
          @change="uploadIcon"
          :id="'icon-' + server.id"
          type="file"
          accept="image/png"
          class="form-control"
        />
      </div>

      <div
        v-if="server.type === 'BEDROCK'"
        class="col-sm-4 d-flex align-items-center"
      >
        <img
          :src="currentIcon(server.id)"
          :alt="server.id"
          class="rounded"
          height="64"
          width="64"
        />
      </div>

      <div class="col-sm-8">
        <label :for="'website-' + server.id" class="form-label">
          {{ t('website') }}
        </label>
        <input
          v-model.trim="server.website"
          :id="'website-' + server.id"
          type="url"
          class="form-control"
          placeholder="https://hypixel.net"
        />
      </div>

      <div class="col-sm-8">
        <button
          @click="emit('delete', server)"
          type="button"
          class="btn btn-danger"
        >
          {{ t('delete') }}
        </button>
      </div>
    </div>
  </div>
</template>
