import { createApp } from 'vue'
import App from './App.vue'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: '#00E676',
          secondary: '#1DE9B6',
          background: '#0A0F1E',
          surface: '#111827',
          'surface-variant': '#1C2A3A',
          error: '#FF5252',
          warning: '#FFD740',
          success: '#00E676',
        }
      }
    }
  }
})

const app = createApp(App)
app.use(vuetify)
app.mount('#app')
