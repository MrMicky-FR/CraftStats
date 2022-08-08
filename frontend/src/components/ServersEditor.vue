<template>
  <nav class="navbar navbar-expand-lg navbar-light mt-3 mb-3">
    <a class="navbar-brand me-auto fs-3" href="/">CraftStats</a>
  </nav>

  <BLoader v-if="loading" :error="error" />

  <form v-else @submit.prevent="save()" class="mb-4">
    <div class="row gx-xl-4 gy-4 mb-3">
      <div v-for="server in servers" :key="server.id" class="col-md-6">
        <div class="box">
          <div class="row g-3 mb-3">
            <div class="col-sm-8">
              <label :for="'name-' + server.id" class="form-label">
                {{ $t('name') }}
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
                {{ $t('version') }}
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
                {{ $t('address') }}
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
                {{ $t('color') }}
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
                {{ $t('icon') }}
              </label>
              <input
                @change="uploadIcon($event, server.id)"
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
          </div>

          <button
            @click="deleteServer(server.id)"
            type="button"
            class="btn btn-danger"
          >
            {{ $t('delete') }}
          </button>
        </div>
      </div>
    </div>

    <button
      @click="addServer(false)"
      type="button"
      class="btn btn-primary me-3"
    >
      {{ $t('add') }}
    </button>

    <button @click="addServer(true)" type="button" class="btn btn-primary me-3">
      {{ $t('addBedrock') }}
    </button>

    <div class="box mt-3">
      <div v-if="saveSuccess" class="alert alert-success">
        {{ $t('saved') }}
      </div>

      <div v-if="saveError" class="alert alert-danger">
        {{ $t('error', { error: saveError }) }}
      </div>

      <div class="mb-3">
        <label for="token" class="form-label">
          {{ $t('token') }}
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
        {{ $t('save') }}
      </button>
    </div>
  </form>
</template>

<script lang="ts">
import type { ServerDescription } from '@/api'

import { defineComponent } from 'vue'
import {
  apiBaseUrl,
  encodeFileAsBase64,
  fetchServers,
  saveServers,
  uploadServerIcons,
} from '@/api'
import BLoader from '@/components/BLoader.vue'

export default defineComponent({
  name: 'ServersEditor',
  components: { BLoader },
  async mounted() {
    try {
      this.servers = await fetchServers()
      this.loading = false
    } catch (e) {
      console.log(e)
      this.error = (e as Error).toString()
    }
  },
  data() {
    return {
      error: undefined as string | undefined,
      loading: true,
      saving: false,
      saveSuccess: false,
      token: '',
      saveError: '',
      servers: [] as ServerDescription[],
      pendingIcons: {} as Record<string, string>,
    }
  },
  methods: {
    addServer(bedrock = false) {
      this.servers.push({
        id: Math.random().toString(16).substr(2, 12),
        name: '',
        type: bedrock ? 'BEDROCK' : 'JAVA',
        address: '',
        version: '',
        color: '#555555',
      })
    },
    deleteServer(serverId: string) {
      this.servers = this.servers.filter((server) => server.id !== serverId)
    },
    async uploadIcon(event: Event, serverId: string) {
      if (!(event.target instanceof HTMLInputElement) || !event.target.files) {
        return
      }

      const file = event.target.files[0]

      if (file.size > 100_000) {
        alert('Max icon size is 100 KB.')
        return
      }

      this.pendingIcons[serverId] = await encodeFileAsBase64(file)
    },
    async save() {
      this.saveError = ''
      this.saveSuccess = false
      this.saving = true

      try {
        if (Object.keys(this.pendingIcons).length) {
          await uploadServerIcons(this.token, this.pendingIcons)
          this.pendingIcons = {}
        }

        const result = await saveServers(this.token, this.servers)

        if (result.data.status === 'success') {
          this.saveSuccess = true
        } else if (result.data.status) {
          this.saveError = result.data.status
        } else {
          this.saveError = `${result.statusText} (${result.status})`
        }
      } catch (e) {
        console.log(e)
        this.saveError = (e as Error).toString()
      }

      this.saving = false
    },
    currentIcon(serverId: string) {
      const pending = this.pendingIcons[serverId]

      if (pending) {
        return pending
      }

      return `${apiBaseUrl}/servers/${serverId}/favicon?time=${Date.now()}`
    },
  },
})
</script>
