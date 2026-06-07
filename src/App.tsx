import { StateUpdater, useEffect, useReducer, useState } from "preact/hooks";
import { init } from "swiftregextester";
import { AppViewModel, Exports, MatchExecutionModeValues, MatchingSemanticsValues, RegexOptions, RepetitionBehaviorValues, WordBoundaryKindValues } from "../.build/plugins/PackageToJS/outputs/Package/bridge-js";
import { TestResult } from "./TestResult";
import { PatternInput } from "./PatternInput";
import { TestInput } from "./TestInput";
import { LoadState } from "./LoadState";

const DEFAULT_OPTIONS: RegexOptions = {
  executionMode: MatchExecutionModeValues.AllMatches,
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

type AppState = {
  pattern: string;
  input: string;
  options: RegexOptions;
  viewModel: LoadState<AppViewModel>;
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

type Action =
  | ["init", { exports: Exports, onUpdate: () => void } | { error: string }]
  | ["setPattern", string]
  | ["setInput", string]
  | ["setOptions", StateUpdater<RegexOptions>]
  | ["forceUpdate"]
  ;

function reducer(oldState: AppState, [action, arg]: Action): AppState {
  let state: AppState;
  switch (action) {
    case "init":
      if ("error" in arg) {
        state = { ...oldState, viewModel: { loading: false, error: arg.error } };
      } else {
        const viewModel = new arg.exports.AppViewModel(arg.onUpdate);
        state = { ...oldState, viewModel: { loading: false, value: viewModel } };
      }
      break;
    case "setPattern":
      state = { ...oldState, pattern: arg };
      break;
    case "setOptions":
      const options = typeof arg === "function" ? arg(oldState.options) : arg;
      state = { ...oldState, options };
      break;
    case "setInput":
      state = { ...oldState, input: arg };
      break;
    case "forceUpdate":
      state = { ...oldState };
      break;
  }

  const viewModel = state.viewModel.value;
  if (viewModel) {
    if (action == "init" || action === "setPattern" || action === "setOptions") {
      viewModel.updateRegex(state.pattern, state.options, state.input);
    } else if (action === "setInput") {
      viewModel.updateInput(state.input);
    }
  }

  return state;
}

const initialState: AppState = {
  pattern: defaultPattern,
  input: defaultInput,
  options: DEFAULT_OPTIONS,
  viewModel: { loading: true },
};

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const load = async () => {
      try {
        const { exports } = await initPromise;
        dispatch(["init", { exports, onUpdate: () => dispatch(["forceUpdate"]) }]);
      } catch (error) {
        dispatch(["init", { error: String(error) }]);
      }
    }
    void load();
  }, []);

  const viewModelState = state.viewModel.value?.uiState;
  const patternError = viewModelState?.patternError || null;

  return (
    <main>
      <section class="inputs">
        <PatternInput
          pattern={state.pattern}
          setPattern={(pattern) => dispatch(["setPattern", pattern])}
          patternError={patternError}
          options={state.options}
          setOptions={(options) => dispatch(["setOptions", options])}
        />

        <TestInput
          input={state.input}
          setInput={(input) => dispatch(["setInput", input])}
        />
      </section>

      <TestResult
        loadState={state.viewModel}
        hasInput={state.input.length > 0}
        result={viewModelState?.result || null}
      />
    </main>
  )
}
