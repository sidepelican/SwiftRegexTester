import './style.css'

// ── UI skeleton ──────────────────────────────────────────────────────────────
const app = document.querySelector('#app')
app.innerHTML = `
  <header>
    <h1>Swift Regex Tester</h1>
    <p>Swift の <code>Regex</code> を WebAssembly 経由でテストします</p>
  </header>
  <main>
    <section class="inputs">
      <div class="field">
        <label for="pattern">正規表現パターン</label>
        <input id="pattern" type="text" placeholder="例: (\\w+)@(\\w+)" spellcheck="false" autocomplete="off" autocapitalize="none">
        <div id="pattern-error" class="field-error" role="alert"></div>
      </div>
      <div class="field">
        <label for="teststr">テスト文字列</label>
        <textarea id="teststr" rows="6" placeholder="テストする文字列を入力してください"></textarea>
      </div>
    </section>
    <section class="results">
      <h2>結果</h2>
      <div id="highlighted" class="highlighted-text" aria-live="polite"></div>
      <div id="match-details" class="match-details"></div>
    </section>
  </main>
`

// ── State ─────────────────────────────────────────────────────────────────────
const patternEl      = document.querySelector('#pattern')
const teststrEl      = document.querySelector('#teststr')
const patternError   = document.querySelector('#pattern-error')
const highlightedEl  = document.querySelector('#highlighted')
const matchDetailsEl = document.querySelector('#match-details')

let swiftExports = null
let RegexCompileResultValues = null
let RegexTestResultValues    = null

// ── Utilities ─────────────────────────────────────────────────────────────────
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  const pattern = patternEl.value
  const input   = teststrEl.value

  if (!swiftExports) return

  if (!pattern) {
    patternError.textContent = ''
    highlightedEl.textContent = input
    matchDetailsEl.innerHTML = ''
    return
  }

  // ── Compile the pattern ───────────────────────────────────────────────────
  const compileResult = swiftExports.createRegex(pattern)

  if (compileResult.tag !== RegexCompileResultValues.Tag.Success) {
    patternError.textContent = compileResult.param0   // error string
    highlightedEl.textContent = input
    matchDetailsEl.innerHTML = ''
    return
  }

  patternError.textContent = ''
  const regex = compileResult.param0   // SwiftRegex instance

  if (!input) {
    highlightedEl.textContent = ''
    matchDetailsEl.innerHTML = ''
    return
  }

  // ── Run matches ───────────────────────────────────────────────────────────
  const testResult = swiftExports.testRegex(regex, input)

  if (testResult.tag !== RegexTestResultValues.Tag.Success) {
    highlightedEl.textContent = input
    matchDetailsEl.innerHTML = ''
    return
  }

  const matches = testResult.param0   // RegexMatch[]

  // ── Highlighted view ───────────────────────────────────────────────────────
  const chars = [...input]
  let html = ''
  let pos  = 0

  for (const m of matches) {
    if (m.start > pos) html += escapeHtml(chars.slice(pos, m.start).join(''))
    html += `<mark>${escapeHtml(chars.slice(m.start, m.end).join(''))}</mark>`
    pos = m.end
  }
  html += escapeHtml(chars.slice(pos).join(''))

  highlightedEl.innerHTML = html || '<span class="placeholder">（空文字列）</span>'

  // ── Match details ──────────────────────────────────────────────────────────
  if (matches.length === 0) {
    matchDetailsEl.innerHTML = '<p class="no-match">マッチなし</p>'
    return
  }

  let details = `<p class="match-count">${matches.length} 件マッチ</p><ol class="match-list">`
  for (const m of matches) {
    details += `<li><code class="match-value">${escapeHtml(m.value)}</code>`
             + ` <span class="range">[${m.start}…${m.end}]</span>`
    if (m.groups.length > 0) {
      details += '<ul class="groups">'
      m.groups.forEach((g, i) => {
        details += `<li>グループ ${i + 1}: <code>${escapeHtml(g.value)}</code>`
                 + ` <span class="range">[${g.start}…${g.end}]</span></li>`
      })
      details += '</ul>'
    }
    details += '</li>'
  }
  details += '</ol>'
  matchDetailsEl.innerHTML = details
}

// ── Load WASM ─────────────────────────────────────────────────────────────────
highlightedEl.innerHTML = '<span class="loading">WebAssembly を読み込み中…</span>'

try {
  const [{ init }, bridgeJS] = await Promise.all([
    import(/* @vite-ignore */ '/wasm/index.js'),
    import(/* @vite-ignore */ '/wasm/bridge-js.js'),
  ])
  const { exports } = await init({})

  swiftExports             = exports
  RegexCompileResultValues = bridgeJS.RegexCompileResultValues
  RegexTestResultValues    = bridgeJS.RegexTestResultValues

  highlightedEl.textContent = ''
  render()
} catch (error) {
  highlightedEl.innerHTML =
    `<span class="load-error">Swift/Wasm の読み込みに失敗しました。<br><code>${escapeHtml(String(error))}</code></span>`
  console.error(error)
}

// ── Event listeners ───────────────────────────────────────────────────────────
patternEl.addEventListener('input', render)
teststrEl.addEventListener('input', render)
