import { RegexMatch } from "../.build/plugins/PackageToJS/outputs/Package/bridge-js";
import { ReactNode } from 'preact/compat';
import { LoadState } from './LoadState';

export function TestResult({
  loadState,
  result,
}: {
  loadState: LoadState<unknown>;
  result: {
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

    {!loadState.loading && !loadState.error &&
      <div class="match-details">
        {result.matches.length === 0 && <p class="no-match">No matches</p>}
        {result.matches.length > 0 && (
          <>
            <p class="match-count">{result.matches.length} match(es)</p>
            <ol class="match-list">
              {result.matches.map((match, matchIndex) => (
                <li key={matchIndex}>
                  <code class="match-value">{match.value}</code>{' '}
                  <span class="range">[{match.start}…{match.end}]</span>
                  {match.groups.length > 0 && (
                    <ul class="groups">
                      {match.groups.map((group, groupIndex) => (
                        <li key={groupIndex}>
                          output.{group.name}: <code>{group.value}</code>{' '}
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
