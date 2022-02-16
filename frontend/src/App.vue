<template>
  <div class="container mb-4 pb-2">
    <ServersEditor v-if="path === '/editor'" />

    <ServersList v-else />

    <i18n-t keypath="credits" tag="p" class="text-center">
      <template v-slot:git>
        <a
          href="https://github.com/MrMicky-FR/CraftStats"
          target="_blank"
          rel="noopener"
        >
          GitHub
        </a>
      </template>
      <template v-slot:workers>
        <a
          href="https://workers.cloudflare.com/"
          target="_blank"
          rel="noopener"
          v-text="'Cloudflare Workers'"
        />
      </template>
      <template v-slot:scaleway>
        <a
          href="https://www.scaleway.com/en/serverless-functions/"
          target="_blank"
          rel="noopener"
        >
          Scaleway Functions
        </a>
      </template>
      <template v-slot:vue>
        <a href="https://vuejs.org/" target="_blank" rel="noopener">Vue.js</a>
      </template>
    </i18n-t>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ServersList from './components/ServersList.vue'
import ServersEditor from './components/ServersEditor.vue'

export default defineComponent({
  name: 'App',
  components: {
    ServersEditor,
    ServersList,
  },
  data() {
    return {
      path: window.location.pathname,
      year: new Date().getFullYear(),
    }
  },
})
</script>

<style lang="scss">
@import 'scss/variables';
@import '~bootstrap';

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.box {
  background: #fff;
  border-radius: 0.5rem;
  border-width: 1px;
  padding: 0.75rem;
  box-shadow: 0 0.2rem 0.3rem rgba(0, 0, 0, 0.2);
}
</style>
