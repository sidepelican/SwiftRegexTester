import { Fragment, ReactNode } from 'preact/compat';
import { RegexResult } from '../.build/plugins/PackageToJS/outputs/Package/bridge-js';
import { LoadState } from './LoadState';
import { LoadingDots } from './Components/LoadingDots';

export function TestResult({
  loadState,
  hasInput,
  result: resultOrNull,
  isComputing,
}: {
  loadState: LoadState<unknown>;
  hasInput: boolean;
  result: RegexResult | null;
  isComputing: boolean;
}): ReactNode {
  const result = resultOrNull ?? { highlightParts: [], matches: [] };
  const matchCountLabel = result.matches.length === 1 ? 'match' : 'matches';
  return <section class="results">
    <h2>Results{isComputing && <span> <LoadingDots/></span>}</h2>

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
            <p class="match-count">{result.matches.length} {matchCountLabel}</p>
            <ol class="match-list">
              {result.matches.map((match, i) => {
                return <li key={i}>
                  <code class="match-value">{match.value}</code>
                  {match.unicodeScalarNames && <span class="scalar-names">({match.unicodeScalarNames})</span>}

                  {match.groups.length > 0 && (
                    <ul class="groups">
                      {match.groups.map((group, j) => (
                        <li key={j}>
                          output.{group.name}: <code>{group.value}</code>
                          {group.unicodeScalarNames && <span class="scalar-names">({group.unicodeScalarNames})</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              })}
            </ol>
          </>
        )}
      </div>
    }
  </section>
}
