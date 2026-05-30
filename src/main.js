import './style.css'

const app = document.querySelector('#app')

app.innerHTML = `
  <main>
    <h1>SwiftRegexTester</h1>
    <p>Swift Package から公開された関数を WebAssembly 経由で呼び出します。</p>
    <pre id="output">Loading WebAssembly…</pre>
  </main>
`

const output = document.querySelector('#output')
const wasmEntrypoint = '/wasm/index.js'

try {
  const { init } = await import(/* @vite-ignore */ wasmEntrypoint)
  const { exports } = await init({})
  output.textContent = exports.hello()
} catch (error) {
  output.textContent = `Failed to load Swift/Wasm output.\n\n${error}`
  console.error(error)
}
