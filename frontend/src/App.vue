<script setup lang="ts">
import { ref } from 'vue'
import ServersEditor from './components/ServersEditor.vue'
import ServersList from './components/ServersList.vue'

const path = ref(window.location.pathname)
</script>

<template>
  <div class="container mb-4 pb-2">
    <ServersEditor v-if="path === '/editor'" />

    <ServersList v-else />

    <i18n-t keypath="credits" scope="global" tag="p" class="text-center">
      <template v-slot:git>
        <a
          href="https://github.com/MrMicky-FR/CraftStats"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </template>
      <template v-slot:workers>
        <a
          href="https://workers.cloudflare.com/"
          target="_blank"
          rel="noopener noreferrer"
          v-text="'Cloudflare Workers'"
        />
      </template>
      <template v-slot:vue>
        <a href="https://vuejs.org/" target="_blank" rel="noopener noreferrer">Vue.js</a>
      </template>
    </i18n-t>
  </div>
</template>
