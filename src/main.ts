import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import 'bootstrap'

import vueformConfig from './../vueform.config'
import Vueform from '@vueform/vueform'
import { tooltipDirective } from '@/stores/useTooltip'
import { useTaskerClient } from './stores/useTaskerClient'

const app = createApp(App)

app.use(createPinia())

const taskerClientStore = useTaskerClient()
taskerClientStore.pingTasker()

app.use(router)
app.use(Vueform, vueformConfig)
app.directive('tooltip', tooltipDirective)
app.mount('#app')
