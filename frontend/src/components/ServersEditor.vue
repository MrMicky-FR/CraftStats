<template>
  <nav class="navbar navbar-expand-lg navbar-light mt-3 mb-3">
    <a class="navbar-brand me-auto fs-3" href="/">CraftStats</a>
  </nav>

  <Loader v-if="loading" :error="error" />

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
              <label :for="'address-' + server.id" class="form-label">
                {{ $t('version') }}
              </label>
              <input
                v-model.trim="server.version"
                :id="'version-' + server.id"
                type="text"
                class="form-control"
                placeholder="1.8-1.17"
              />
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
              <label :for="'color-' + server.color" class="form-label">
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
          </div>

          <VButton @click="deleteServer(server.id)" color="danger">
            {{ $t('delete') }}
          </VButton>
        </div>
      </div>
    </div>

    <VButton @click="addServer()" class="me-3">
      {{ $t('add') }}
    </VButton>

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

      <VButton :disabled="saving" type="submit">
        <span v-if="saving" class="spinner-border spinner-border-sm" />
        {{ $t('save') }}
      </VButton>
    </div>
  </form>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { fetchServers, saveServers, ServerDescription } from '@/api'
import Loader from '@/components/Loader.vue'
import VButton from '@/components/VButton.vue'

export default defineComponent({
  name: 'ServersEditor',
  components: { Loader, VButton },
  async mounted() {
    try {
      this.servers = await fetchServers()
      this.loading = false
    } catch (e) {
      console.log(e)
      this.error = e.toString()
    }
  },
  data() {
    return {
      error: null,
      loading: true,
      saving: false,
      saveSuccess: false,
      token: '',
      saveError: '',
      servers: [] as ServerDescription[],
    }
  },
  methods: {
    addServer() {
      this.servers.push({
        id: Math.random().toString(16).substr(2, 12),
        name: '',
        address: '',
        version: '',
        color: '#555555',
      })
    },
    deleteServer(serverId: string) {
      this.servers = this.servers.filter((server) => server.id !== serverId)
    },
    async save() {
      this.saveError = ''
      this.saveSuccess = false
      this.saving = true

      try {
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
        this.saveError = e.toString()
      }

      this.saving = false
    },
  },
})
</script>
