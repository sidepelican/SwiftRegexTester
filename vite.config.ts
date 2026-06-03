import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames(assetInfo) {
          if (assetInfo.names?.some(n => n.endsWith('.wasm'))) {
            return 'assets/[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
})
