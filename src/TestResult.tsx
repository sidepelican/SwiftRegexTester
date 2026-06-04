import { Fragment, ReactNode } from 'preact/compat';
import { RegexResult } from '../.build/plugins/PackageToJS/outputs/Package/bridge-js';
import { LoadState } from './LoadState';

const EMPTY_RESULT: RegexResult = { highlightParts: [], matches: [] };

function formatElapsedTime(elapsedMs: number): string {
  if (elapsedMs >= 1_000) {
    return `${(elapsedMs / 1_000).toFixed(2)} s`;
  }
  return `${elapsedMs.toFixed(1)} ms`;
}

export function TestResult({
  loadState,
  hasInput,
  invalidPattern,
  isRunning,
  errorMessage,
  elapsedMs,
  result: resultOrNull,
}: {
  loadState: LoadState<unknown>;
  hasInput: boolean;
  invalidPattern: boolean;
  isRunning: boolean;
  errorMessage: string;
  elapsedMs: number | null;
  result: RegexResult | null;
}): ReactNode {
  const result = resultOrNull ?? EMPTY_RESULT;
  const matchCountLabel = result.matches.length === 1 ? 'match' : 'matches';
  const showElapsedTime = elapsedMs !== null && !loadState.loading && !loadState.error && hasInput && !isRunning;

  return <section class="results">
    <h2>Results</h2>

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
      {!loadState.loading && !loadState.error && hasInput && invalidPattern && (
        <span class="placeholder">Fix regex pattern to test</span>
      )}
      {!loadState.loading && !loadState.error && hasInput && !invalidPattern && isRunning && (
        <span class="loading">Running regex…</span>
      )}
      {!loadState.loading && !loadState.error && hasInput && !invalidPattern && !isRunning && errorMessage && (
        <span class="result-error-text">{errorMessage}</span>
      )}
      {!loadState.loading && !loadState.error && hasInput && !invalidPattern && !isRunning && !errorMessage &&
        result.highlightParts.map((part, index) =>
          part.marked ? <mark key={index}>{part.text}</mark> : <Fragment key={index}>{part.text}</Fragment>,
        )}
    </div>

    {showElapsedTime && (
      <p class="evaluation-time">Processed in {formatElapsedTime(elapsedMs)}</p>
    )}

    {!loadState.loading && !loadState.error && hasInput && !invalidPattern && !isRunning && !errorMessage &&
      <div class="match-details">
        {result.matches.length === 0 && <p class="no-match">No matches</p>}
        {result.matches.length > 0 && (
          <>
            <p class="match-count">{result.matches.length} {matchCountLabel}</p>
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
  </section>;
}
