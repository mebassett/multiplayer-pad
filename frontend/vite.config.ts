import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import checker from 'vite-plugin-checker'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [wasm(),react(), checker({ typescript: true})],
  worker: { format: "es", plugins: () => [wasm()], },
  server: { host: true },
  build: { target: 'es2022' }
})
