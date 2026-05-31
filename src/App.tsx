import { Fragment } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import { init } from 'swiftregextester';
import { Exports, MatchingSemanticsTag, RegexCompileResultValues, RegexMatch, RegexOptions, RepetitionBehaviorTag, WordBoundaryKindTag } from '../.build/plugins/PackageToJS/outputs/Package/bridge-js';

const DEFAULT_OPTIONS: RegexOptions = {
  anchorsMatchLineEndings: false,
  asciiOnlyCharacterClasses: false,
  asciiOnlyDigits: false,
  asciiOnlyWhitespace: false,
  asciiOnlyWordCharacters: false,
  dotMatchesNewlines: false,
  ignoresCase: false,
  matchingSemantics: 'graphemeCluster',
  repetitionBehavior: 'eager',
  wordBoundaryKind: 'defaultBoundaries',
};

type Runtime = {
  swiftExports: Exports;
};

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

export function App() {
  const [pattern, setPattern] = useState('')
  const [input, setInput] = useState('')
  const [runtime, setRuntime] = useState<Runtime | null>(null)
  const [loadError, setLoadError] = useState('')
  const [options, setOptions] = useState<RegexOptions>(DEFAULT_OPTIONS)

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const { exports } = await init();
        if (!alive) return

        setRuntime({
          swiftExports: exports
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

    const compileResult = runtime.swiftExports.SwiftRegex.tryInit(pattern, options);
    if (compileResult.tag !== RegexCompileResultValues.Tag.Success) {
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
    const swiftRegex = compileResult.param0;
    const matches = swiftRegex.matches(input);
    return {
      patternError: '',
      highlightParts: buildHighlightParts(input, matches),
      showPlaceholder: matches.length === 0 && input.length === 0,
      matches,
      showNoMatch: matches.length === 0,
    }
  }, [input, pattern, runtime, options])

  return (
    <main>
      <section class="inputs">
          <div class="field">
            <div class="field-header">
              <label for="pattern">正規表現パターン</label>
              <button
                class="options-btn"
                type="button"
                popovertarget="options-popup"
              >
                オプション ▼
              </button>
            </div>
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

      {/* Options popover — native browser popover; light-dismiss built-in */}
      <div
        id="options-popup"
        class="options-popup"
        popover="auto"
      >
        <div class="options-checkboxes">
          {(
            [
              'anchorsMatchLineEndings',
              'asciiOnlyCharacterClasses',
              'asciiOnlyDigits',
              'asciiOnlyWhitespace',
              'asciiOnlyWordCharacters',
              'dotMatchesNewlines',
              'ignoresCase',
            ] as const
          ).map((key) => (
            <label key={key} class="option-checkbox-label">
              <input
                type="checkbox"
                checked={options[key]}
                onChange={() => setOptions((prev) => ({ ...prev, [key]: !prev[key] }))}
              />
              {key}
            </label>
          ))}
        </div>
        <div class="options-selects">
          <div class="option-select-row">
            <label class="option-select-label" for="opt-matchingSemantics">matchingSemantics</label>
            <select
              id="opt-matchingSemantics"
              value={options.matchingSemantics}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  matchingSemantics: (e.currentTarget as HTMLSelectElement).value as MatchingSemanticsTag,
                }))
              }
            >
              <option value="graphemeCluster">graphemeCluster (default)</option>
              <option value="unicodeScalar">unicodeScalar</option>
            </select>
          </div>
          <div class="option-select-row">
            <label class="option-select-label" for="opt-repetitionBehavior">repetitionBehavior</label>
            <select
              id="opt-repetitionBehavior"
              value={options.repetitionBehavior}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  repetitionBehavior: (e.currentTarget as HTMLSelectElement).value as RepetitionBehaviorTag,
                }))
              }
            >
              <option value="eager">eager (default)</option>
              <option value="possessive">possessive</option>
              <option value="reluctant">reluctant</option>
            </select>
          </div>
          <div class="option-select-row">
            <label class="option-select-label" for="opt-wordBoundaryKind">wordBoundaryKind</label>
            <select
              id="opt-wordBoundaryKind"
              value={options.wordBoundaryKind}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  wordBoundaryKind: (e.currentTarget as HTMLSelectElement).value as WordBoundaryKindTag,
                }))
              }
            >
              <option value="defaultBoundaries">defaultBoundaries (default)</option>
              <option value="simple">simple</option>
            </select>
          </div>
        </div>
      </div>

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
