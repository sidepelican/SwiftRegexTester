import { defineConfig, type Plugin } from 'vite'

function wasmPreload(): Plugin {
  return {
    name: 'wasm-preload',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        if (!ctx.bundle) return []
        return Object.values(ctx.bundle)
          .filter(chunk => chunk.fileName.endsWith('.wasm'))
          .map(chunk => ({
            tag: 'link' as const,
            attrs: {
              rel: 'preload',
              as: 'fetch',
              crossorigin: '',
              href: '/' + chunk.fileName,
            },
            injectTo: 'head' as const,
          }))
      },
    },
  }
}

export default defineConfig({
  plugins: [wasmPreload()],
})
