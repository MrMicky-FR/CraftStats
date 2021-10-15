<template>
  <button
    :type="type"
    :class="'btn-' + color"
    :disabled="disabled"
    class="btn rounded-pill shadow-sm py-2"
  >
    <slot />
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'VButton',
  props: {
    type: {
      type: String,
      default: 'button',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: 'primary',
    },
  },
})
</script>
