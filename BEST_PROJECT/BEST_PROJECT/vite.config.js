import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue' // Pacchetto standard ufficiale di Vue

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api-calcio': {
        target: 'https://api.football-data.org/v4',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-calcio/, ''),
        headers: {
          // MODIFICA: Metti qui il tuo token reale di football-data se ne hai uno attivo!
          'X-Auth-Token': 'IL_TUO_TOKEN_QUI'
        }
      }
    }
  }
})