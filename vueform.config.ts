// vueform.config.(js|ts)

import en from '@vueform/vueform/locales/en'
import bootstrap from '@vueform/vueform/dist/bootstrap'
import { defineConfig } from '@vueform/vueform'

export default defineConfig({
    theme: bootstrap,
    locales: { en },
    locale: 'en',
})
