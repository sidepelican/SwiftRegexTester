import { Fragment, ReactNode } from 'preact/compat';
import { HighlightPart, RegexMatch } from '../.build/plugins/PackageToJS/outputs/Package/bridge-js';
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
    <h2>Results</h2>
    {loadState.loading && <p class="loading">Loading WebAssembly…</p>}
    {!loadState.loading && loadState.error && (
      <p class="load-error">
        Failed to load Swift/Wasm.
        <br />
        <code>{loadState.error}</code>
      </p>
    )}

    <div class="highlighted-text" aria-live="polite">
      {loadState.loading && <span class="loading">Loading WebAssembly…</span>}
      {!loadState.loading && loadState.error && (
        <span class="load-error">
          Failed to load Swift/Wasm.
          <br />
          <code>{loadState.error}</code>
        </span>
      )}
      {!loadState.loading && !loadState.error && !hasInput && (
        <span class="placeholder">Enter text to test</span>
      )}
      {!loadState.loading && !loadState.error &&
        result.highlightParts.map((part, index) =>
          part.marked ? <mark key={index}>{part.text}</mark> : <Fragment key={index}>{part.text}</Fragment>,
        )}
    </div>

    {!loadState.loading && !loadState.error && hasInput &&
      <div class="match-details">
        {result.matches.length === 0 && <p class="no-match">No matches</p>}
        {result.matches.length > 0 && (
          <>
            <p class="match-count">{result.matches.length} match(es)</p>
            <ol class="match-list">
              {result.matches.map((match, matchIndex) => (
                <li key={matchIndex}>
                  <code class="match-value">{match.value}</code>
                  {match.groups.length > 0 && (
                    <ul class="groups">
                      {match.groups.map((group, groupIndex) => (
                        <li key={groupIndex}>
                          output.{group.name}: <code>{group.value}</code>
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
