import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

import autoscroll from '@/directives/autoscroll.js'

const app = createApp(App)

app.directive('autoscroll', autoscroll)

app.mount('#app')
