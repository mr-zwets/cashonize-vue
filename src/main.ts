import './assets/main.css'

import { createApp } from 'vue'
import AsyncApp from './AsyncApp.vue'
import { createPinia } from 'pinia'

const app = createApp(AsyncApp)
app.use(createPinia())
app.mount('#app')
