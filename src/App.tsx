import { StateUpdater, useEffect, useReducer } from 'preact/hooks';
import { init } from 'swiftregextester';
import { Exports, MatchingSemanticsValues, RegexOptions, RegexResult, RepetitionBehaviorValues, SwiftRegex, WordBoundaryKindValues } from '../.build/plugins/PackageToJS/outputs/Package/bridge-js';
import { TestResult } from './TestResult';
import { PatternInput } from './PatternInput';
import { TestInput } from './TestInput';
import { LoadState } from './LoadState';

const DEFAULT_OPTIONS: RegexOptions = {
  anchorsMatchLineEndings: false,
  asciiOnlyCharacterClasses: false,
  asciiOnlyDigits: false,
  asciiOnlyWhitespace: false,
  asciiOnlyWordCharacters: false,
  dotMatchesNewlines: false,
  ignoresCase: false,
  matchingSemantics: MatchingSemanticsValues.GraphemeCluster,
  repetitionBehavior: RepetitionBehaviorValues.Eager,
  wordBoundaryKind: WordBoundaryKindValues.DefaultBoundaries,
};

type Runtime = {
  swiftExports: Exports;
};

type RegexCompileResult = { regex: SwiftRegex } | { error: string };

type AppState = {
  pattern: string;
  input: string;
  runtime: LoadState<Runtime>;
  options: RegexOptions;
  compiledRegex: RegexCompileResult | null;
  result: RegexResult | null;
};

const initPromise = init();

const defaultPattern = `(?<year>\\d{4}).(?<month>\\d{1,2}).(?<day>\\d{1,2})`;
const defaultInput = `INVOICE #INV-78492
Billing Period: 2026.5.1 - 2026.5.31
Due Date: 2026.6.30
Payment processed on 2026.5.20

Customer ID: CUST3398-Ⅲ-Ⅸ
Total Amount: $1,248.75
Payment Method: Credit Card (**** 4242)
Thank you for your business.
System Generated: 2026-06-03T14:22:07Z`;

function compileRegex(runtime: Runtime, pattern: string, options: RegexOptions): RegexCompileResult | null {
  if (!pattern) {
    return null;
  }
  try {
    return { regex: new runtime.swiftExports.SwiftRegex(pattern, options) };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

type Action =
  | ['setRuntime', LoadState<Runtime>]
  | ['setPattern', string]
  | ['setInput', string]
  | ['setOptions', StateUpdater<RegexOptions> ]

function reducer(oldState: AppState, [action, arg]: Action): AppState {
  let state: AppState;
  switch (action) {
    case 'setRuntime':
      state = { ...oldState, runtime: arg };
      break;
    case 'setPattern': 
      state = { ...oldState, pattern: arg };
      break;
    case 'setOptions': {
      const options = typeof arg === 'function' ? arg(oldState.options) : arg;
      state = { ...oldState, options };
      break;
    }
    case 'setInput':
      state = { ...oldState, input: arg };
      break;
  }

  if (!state.runtime.value) { 
    return state;
  }

  if (action === 'setRuntime' || action === 'setPattern' || action === 'setOptions') {
    state.compiledRegex = compileRegex(state.runtime.value, state.pattern, state.options);
  }

  if (state.compiledRegex && 'regex' in state.compiledRegex) {
    state.result = state.compiledRegex.regex.result(state.input);
  } else {
    state.result = null;
  }

  return state;
}

const initialState: AppState = {
  pattern: defaultPattern,
  input: defaultInput,
  runtime: { loading: true },
  options: DEFAULT_OPTIONS,
  compiledRegex: null,
  result: { highlightParts: [], matches: [] },
};

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const load = async () => {
      try {
        const { exports } = await initPromise;
        dispatch(['setRuntime', { loading: false, value: { swiftExports: exports } }])
      } catch (error) {
        dispatch(['setRuntime', { loading: false, error: String(error) }])
      }
    }
    void load();
  }, []);

  const patternError = state.compiledRegex && 'error' in state.compiledRegex
    ? state.compiledRegex.error
    : '';

  return (
    <main>
      <section class="inputs">
        <PatternInput
          pattern={state.pattern}
          setPattern={(pattern) => dispatch(['setPattern', pattern])}
          patternError={patternError}
          options={state.options}
          setOptions={(options) => dispatch(['setOptions', options])}
        />

        <TestInput
          input={state.input}
          setInput={(input) => dispatch(['setInput', input])}
        />
      </section>

      <TestResult
        loadState={state.runtime}
        hasInput={state.input.length > 0}
        result={state.result}
      />
    </main>
  )
}
