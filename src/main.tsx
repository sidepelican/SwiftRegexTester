import { Fragment, render } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import './style.css'

type RegexGroup = { value: string; start: number; end: number }
type RegexMatch = { value: string; start: number; end: number; groups: RegexGroup[] }
type TaggedResult = { tag: number; param0: unknown }
type SwiftExports = { createRegex: (pattern: string) => TaggedResult; testRegex: (regex: unknown, input: string) => TaggedResult }

type Runtime = {
  swiftExports: SwiftExports
  regexCompileSuccessTag: number
  regexTestSuccessTag: number
}

type HighlightPart = { text: string; marked: boolean }

function buildHighlightParts(input: string, matches: RegexMatch[]): HighlightPart[] {
  const chars = [...input]
  const parts: HighlightPart[] = []
  let pos = 0

  for (const match of matches) {
    if (match.start > pos) {
      parts.push({ text: chars.slice(pos, match.start).join(''), marked: false })
    }
    parts.push({ text: chars.slice(match.start, match.end).join(''), marked: true })
    pos = match.end
  }

  if (pos < chars.length) {
    parts.push({ text: chars.slice(pos).join(''), marked: false })
  }

  return parts
}

function readSuccessTag(moduleLike: unknown, exportName: string): number {
  const tag =
    typeof moduleLike === 'object' && moduleLike !== null
      ? (moduleLike as { [key: string]: unknown })[exportName]
      : undefined
  if (typeof tag !== 'object' || tag === null) {
    throw new Error(`Missing ${exportName}`)
  }

  const tagContainer = (tag as { Tag?: unknown }).Tag
  if (typeof tagContainer !== 'object' || tagContainer === null) {
    throw new Error(`Missing ${exportName}.Tag`)
  }

  const successTag = (tagContainer as { Success?: unknown }).Success
  if (typeof successTag !== 'number') {
    throw new Error(`Missing ${exportName}.Tag.Success`)
  }

  return successTag
}

function isRegexMatchArray(value: unknown): value is RegexMatch[] {
  return Array.isArray(value)
}

function App() {
  const [pattern, setPattern] = useState('')
  const [input, setInput] = useState('')
  const [runtime, setRuntime] = useState<Runtime | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const wasmIndexPath = '/wasm/index.js'
        const bridgePath = '/wasm/bridge-js.js'
        const [{ init }, bridgeJS] = await Promise.all([
          import(/* @vite-ignore */ wasmIndexPath) as Promise<{
            init: (options: Record<string, unknown>) => Promise<{ exports: unknown }>
          }>,
          import(/* @vite-ignore */ bridgePath),
        ])

        const { exports } = await init({})
        if (!alive) return

        setRuntime({
          swiftExports: exports as SwiftExports,
          regexCompileSuccessTag: readSuccessTag(bridgeJS, 'RegexCompileResultValues'),
          regexTestSuccessTag: readSuccessTag(bridgeJS, 'RegexTestResultValues'),
        })
      } catch (error) {
        if (!alive) return
        setLoadError(String(error))
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  const result = useMemo(() => {
    if (!runtime) {
      return {
        patternError: '',
        highlightParts: [] as HighlightPart[],
        showPlaceholder: false,
        matches: [] as RegexMatch[],
        showNoMatch: false,
      }
    }

    if (!pattern) {
      return {
        patternError: '',
        highlightParts: input ? [{ text: input, marked: false }] : [],
        showPlaceholder: input.length === 0,
        matches: [] as RegexMatch[],
        showNoMatch: false,
      }
    }

    const compileResult = runtime.swiftExports.createRegex(pattern)
    if (compileResult.tag !== runtime.regexCompileSuccessTag) {
      return {
        patternError: typeof compileResult.param0 === 'string' ? compileResult.param0 : String(compileResult.param0),
        highlightParts: input ? [{ text: input, marked: false }] : [],
        showPlaceholder: input.length === 0,
        matches: [] as RegexMatch[],
        showNoMatch: false,
      }
    }

    if (!input) {
      return {
        patternError: '',
        highlightParts: [],
        showPlaceholder: true,
        matches: [] as RegexMatch[],
        showNoMatch: false,
      }
    }

    const testResult = runtime.swiftExports.testRegex(compileResult.param0, input)
    if (testResult.tag !== runtime.regexTestSuccessTag || !isRegexMatchArray(testResult.param0)) {
      return {
        patternError: '',
        highlightParts: [{ text: input, marked: false }],
        showPlaceholder: false,
        matches: [] as RegexMatch[],
        showNoMatch: false,
      }
    }

    const matches = testResult.param0
    return {
      patternError: '',
      highlightParts: buildHighlightParts(input, matches),
      showPlaceholder: matches.length === 0 && input.length === 0,
      matches,
      showNoMatch: matches.length === 0,
    }
  }, [input, pattern, runtime])

  return (
    <main>
      <section class="inputs">
          <div class="field">
            <label for="pattern">正規表現パターン</label>
            <input
              id="pattern"
              type="text"
              placeholder={'例: (\\w+)@(\\w+)'}
              spellcheck={false}
              autoComplete="off"
              autoCapitalize="none"
              value={pattern}
              onInput={(event) => setPattern((event.currentTarget as HTMLInputElement).value)}
            />
            <div id="pattern-error" class="field-error" role="alert">
              {result.patternError}
            </div>
          </div>

          <div class="field">
            <label for="teststr">テスト文字列</label>
            <textarea
              id="teststr"
              rows={6}
              placeholder="テストする文字列を入力してください"
              value={input}
              onInput={(event) => setInput((event.currentTarget as HTMLTextAreaElement).value)}
            />
          </div>
      </section>

      <section class="results">
        <h2>結果</h2>
        <div class="highlighted-text" aria-live="polite">
          {!runtime && !loadError && <span class="loading">WebAssembly を読み込み中…</span>}
          {loadError && (
            <span class="load-error">
              Swift/Wasm の読み込みに失敗しました。
              <br />
              <code>{loadError}</code>
            </span>
          )}
          {runtime && !loadError && result.showPlaceholder && (
            <span class="placeholder">（空文字列）</span>
          )}
          {runtime &&
            !loadError &&
            result.highlightParts.map((part, index) =>
              part.marked ? <mark key={index}>{part.text}</mark> : <Fragment key={index}>{part.text}</Fragment>,
            )}
        </div>

        <div class="match-details">
          {runtime && !loadError && result.showNoMatch && <p class="no-match">マッチなし</p>}
          {runtime && !loadError && result.matches.length > 0 && (
            <>
              <p class="match-count">{result.matches.length} 件マッチ</p>
              <ol class="match-list">
                {result.matches.map((match, matchIndex) => (
                  <li key={matchIndex}>
                    <code class="match-value">{match.value}</code>{' '}
                    <span class="range">[{match.start}…{match.end}]</span>
                    {match.groups.length > 0 && (
                      <ul class="groups">
                        {match.groups.map((group, groupIndex) => (
                          <li key={groupIndex}>
                            グループ {groupIndex + 1}: <code>{group.value}</code>{' '}
                            <span class="range">[{group.start}…{group.end}]</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </section>
    </main>
  )
}

render(<App />, document.querySelector('#app') as HTMLElement)
