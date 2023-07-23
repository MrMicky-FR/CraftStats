<script setup lang="ts">
import type { ServerDescription } from '@/api'

import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchServers, saveServers, uploadServerIcons } from '@/api'
import BLoader from '@/components/BLoader.vue'
import EditorServer from '@/components/EditorServer.vue'
import ThemeButton from '@/components/ThemeButton.vue'

const { t } = useI18n()

const loading = ref(true)
const saving = ref(false)
const saveSuccess = ref(false)
const token = ref('')
const error = ref<string>()
const saveError = ref<string>()
const servers = reactive<ServerDescription[]>([])
const pendingIcons = reactive<Record<string, string>>({})

onMounted(async () => {
  try {
    servers.push(...(await fetchServers()))
    loading.value = false
  } catch (e) {
    console.log(e)
    error.value = e?.toString()
  }
})

function addServer(bedrock = false) {
  servers.push({
    id: Math.random().toString(16).substring(2, 12),
    name: '',
    type: bedrock ? 'BEDROCK' : 'JAVA',
    address: '',
    version: '',
    color: '#555555',
  })
}

function deleteServer(server: ServerDescription) {
  while (servers.includes(server)) {
    servers.splice(servers.indexOf(server), 1)
  }
}

async function save() {
  saveError.value = undefined
  saveSuccess.value = false
  saving.value = true

  try {
    if (Object.keys(pendingIcons).length) {
      await uploadServerIcons(token.value, pendingIcons)

      Object.keys(pendingIcons).forEach((key) => delete pendingIcons[key])
    }

    const result = await saveServers(token.value, servers)

    if (result.status === 'success') {
      saveSuccess.value = true
    } else if (result.status) {
      saveError.value = result.status
    } else {
      saveError.value = `${result.statusText} (${result.status})`
    }
  } catch (e) {
    console.log(e)
    saveError.value = e?.toString()
  }

  saving.value = false
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-light mt-3 mb-3">
    <a class="navbar-brand me-auto fs-3" href="/">CraftStats</a>

    <ThemeButton />
  </nav>

  <BLoader v-if="loading" :error="error" />

  <form v-else @submit.prevent="save" class="mb-4">
    <div class="row gx-xl-4 gy-4 mb-3">
      <div v-for="(server, index) in servers" :key="server.id" class="col-md-6">
        <EditorServer
          v-model="servers[index]"
          v-model:icon="pendingIcons[server.id]"
          @delete="deleteServer"
        />
      </div>
    </div>

    <button
      @click="addServer(false)"
      type="button"
      class="btn btn-primary me-3"
    >
      {{ t('add') }}
    </button>

    <button @click="addServer(true)" type="button" class="btn btn-primary me-3">
      {{ t('add_bedrock') }}
    </button>

    <div class="box mt-3">
      <div v-if="saveSuccess" class="alert alert-success">
        {{ t('saved') }}
      </div>

      <div v-if="saveError" class="alert alert-danger">
        {{ t('error', { error: saveError }) }}
      </div>

      <div class="mb-3">
        <label for="token" class="form-label">
          {{ t('token') }}
        </label>
        <input
          v-model.trim="token"
          id="token"
          type="text"
          class="form-control"
          required
        />
      </div>

      <button :disabled="saving" type="submit" class="btn btn-primary">
        <span v-if="saving" class="spinner-border spinner-border-sm" />
        {{ t('save') }}
      </button>
    </div>
  </form>
</template>
