import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      proxy: {
        '/api-football': {
          target: 'https://free-api-live-football-data.p.rapidapi.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-football/, ''),
          headers: {
            'x-rapidapi-key': env.VITE_RAPIDAPI_KEY,
            'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com'
          }
        }
      }
    }
  }
})