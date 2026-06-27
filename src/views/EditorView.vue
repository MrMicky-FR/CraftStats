<script setup lang="ts">
import type { ServerDescription } from '@/api'

import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchServers, saveServers } from '@/api'
import BLoader from '@/components/BLoader.vue'
import EditorServer from '@/components/EditorServer.vue'

const { t } = useI18n()

const loading = ref(true)
const saving = ref(false)
const saveSuccess = ref(false)
const token = ref('')
const error = ref<unknown>()
const saveError = ref<string>()
const servers = reactive<ServerDescription[]>([])
const pendingIcons = reactive<Record<string, string>>({})
const iconRefresh = ref(Date.now())

onMounted(async () => {
  try {
    servers.push(...(await fetchServers()))
  } catch (e: unknown) {
    console.error(e)
    error.value = e
  } finally {
    loading.value = false
  }
})

function addServer(bedrock = false) {
  const serverId = crypto.randomUUID().slice(0, 8)

  if (servers.some((s) => s.id === serverId)) {
    return addServer(bedrock) // Generate a new ID in the unlikely case of duplicated ID
  }

  servers.push({
    id: serverId,
    name: '',
    type: bedrock ? 'BEDROCK' : 'JAVA',
    address: '',
    version: '',
    color: '#555555',
  })
}

function deleteServer(server: ServerDescription) {
  const index = servers.indexOf(server)

  if (index >= 0) {
    servers.splice(index, 1)
  }

  delete pendingIcons[server.id]
}

async function save() {
  if (saving.value) {
    return
  }

  saveError.value = undefined
  saveSuccess.value = false
  saving.value = true

  try {
    await saveServers(token.value, servers, pendingIcons)

    Object.keys(pendingIcons).forEach((key) => delete pendingIcons[key])
    iconRefresh.value = Date.now()

    saveSuccess.value = true
  } catch (error) {
    console.error(error)

    if (error && typeof error === 'object' && 'error' in error && 'status' in error) {
      saveError.value = `${error.error} (${error.status})`
      return
    }

    saveError.value = String(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BLoader v-if="loading || error" :error />

  <form v-else @submit.prevent="save" class="mb-4">
    <div class="row gx-xl-4 gy-4 mb-3">
      <div v-for="(server, index) in servers" :key="server.id" class="col-md-6">
        <EditorServer
          v-model="servers[index]!"
          v-model:icon="pendingIcons[server.id]"
          :icon-refresh="iconRefresh"
          @delete="deleteServer"
        />
      </div>
    </div>

    <button @click="addServer(false)" type="button" class="btn btn-primary me-3">
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
        <input v-model.trim="token" id="token" type="password" class="form-control" required />
      </div>

      <button :disabled="saving" type="submit" class="btn btn-primary">
        <span v-if="saving" class="spinner-border spinner-border-sm" />
        {{ t('save') }}
      </button>
    </div>
  </form>
</template>
