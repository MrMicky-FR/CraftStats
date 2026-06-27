<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import ThemeButton from '@/components/ThemeButton.vue'
</script>

<template>
  <div class="container mb-4 pb-2">
    <nav class="navbar navbar-expand-lg mt-3 mb-3">
      <RouterLink to="/" class="navbar-brand me-auto fs-3">CraftStats</RouterLink>

      <ThemeButton class="me-2 me-md-3" />
      <div id="navbar-stack" />
    </nav>

    <RouterView />

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
