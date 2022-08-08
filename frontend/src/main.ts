import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import en from './i18n/en'
import App from './App.vue'

import './assets/app.scss'

const i18n = createI18n({
  messages: { en },
  locale: 'en',
  fallbackLocale: 'en',
})

createApp(App).use(i18n).mount('#app')
