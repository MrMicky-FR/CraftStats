import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import messages from '@intlify/unplugin-vue-i18n/messages'
import App from './App.vue'

import './assets/app.scss'

const i18n = createI18n({
  legacy: false,
  messages,
  locale: 'en',
  fallbackLocale: 'en',
})

createApp(App).use(i18n).mount('#app')
