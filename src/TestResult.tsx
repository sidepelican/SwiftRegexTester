import { Fragment } from 'preact';
import { RegexMatch } from "../.build/plugins/PackageToJS/outputs/Package/bridge-js";
import { HighlightPart } from "./HighlightPart";
import { ReactNode } from 'preact/compat';
import { LoadState } from './LoadState';

export function TestResult({
  loadState,
  hasInput,
  result,
}: {
  loadState: LoadState<unknown>;
  hasInput: boolean;
  result: {
    highlightParts: HighlightPart[];
    matches: RegexMatch[];
  }
}): ReactNode {
  return <section class="results">
    <h2>結果</h2>
    <div class="highlighted-text" aria-live="polite">
      {loadState.loading && <span class="loading">WebAssembly を読み込み中…</span>}
      {!loadState.loading && loadState.error && (
        <span class="load-error">
          Swift/Wasm の読み込みに失敗しました。
          <br />
          <code>{loadState.error}</code>
        </span>
      )}
      {!loadState.loading && !loadState.error && !hasInput && (
        <span class="placeholder">（空文字列）</span>
      )}
      {!loadState.loading && !loadState.error &&
        result.highlightParts.map((part, index) =>
          part.marked ? <mark key={index}>{part.text}</mark> : <Fragment key={index}>{part.text}</Fragment>,
        )}
    </div>

    { !loadState.loading && !loadState.error && hasInput && 
      <div class="match-details">
        { result.matches.length === 0 && <p class="no-match">マッチなし</p>}
        { result.matches.length > 0 && (
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
                          グループ {group.name}: <code>{group.value}</code>{' '}
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
    }
  </section>
}
