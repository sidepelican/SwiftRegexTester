import { StateUpdater, useEffect, useReducer, useRef } from 'preact/hooks';
import { init } from 'swiftregextester';
import { MatchingSemanticsValues, RegexOptions, RegexResult, RepetitionBehaviorValues, WordBoundaryKindValues } from '../.build/plugins/PackageToJS/outputs/Package/bridge-js';
import { PatternInput } from './PatternInput';
import { TestInput } from './TestInput';
import { LoadState } from './LoadState';
import { TestResult } from './TestResult';
import type { RegexWorkerRequest, RegexWorkerResponse } from './regexWorkerProtocol';

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

const EMPTY_RESULT: RegexResult = {
  highlightParts: [],
  matches: [],
};

const WORKER_TIMEOUT_MS = 3_000;
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

type EvaluationErrorKind = 'compile' | 'runtime' | 'timeout';

type EvaluationState = {
  status: 'idle' | 'running' | 'ready' | 'error';
  result: RegexResult | null;
  error: string;
  errorKind: EvaluationErrorKind | null;
  elapsedMs: number | null;
};

type EvaluationRequest = {
  requestId: number;
  pattern: string;
  input: string;
  options: RegexOptions;
};

type AppState = {
  loadState: LoadState<true>;
  pattern: string;
  input: string;
  options: RegexOptions;
  evaluation: EvaluationState;
  pendingRequest: EvaluationRequest | null;
  nextRequestId: number;
};

type ActiveRequest = {
  requestId: number;
  worker: Worker;
  timeoutId: number;
};

type Action =
  | ['runtimeLoaded']
  | ['runtimeFailed', string]
  | ['setPattern', string]
  | ['setInput', string]
  | ['setOptions', StateUpdater<RegexOptions>]
  | ['requestSucceeded', { requestId: number; result: RegexResult; elapsedMs: number }]
  | ['requestFailed', { requestId: number; error: string; errorKind: EvaluationErrorKind; elapsedMs: number | null }];

const idleEvaluationState: EvaluationState = {
  status: 'idle',
  result: null,
  error: '',
  errorKind: null,
  elapsedMs: null,
};

function prepareEvaluation(state: AppState): AppState {
  if (state.loadState.loading || state.loadState.error) {
    return {
      ...state,
      pendingRequest: null,
      evaluation: idleEvaluationState,
    };
  }

  if (!state.input) {
    return {
      ...state,
      pendingRequest: null,
      evaluation: idleEvaluationState,
    };
  }

  if (!state.pattern) {
    return {
      ...state,
      pendingRequest: null,
      evaluation: {
        status: 'ready',
        result: EMPTY_RESULT,
        error: '',
        errorKind: null,
        elapsedMs: 0,
      },
    };
  }

  const requestId = state.nextRequestId + 1;

  return {
    ...state,
    nextRequestId: requestId,
    pendingRequest: {
      requestId,
      pattern: state.pattern,
      input: state.input,
      options: state.options,
    },
    evaluation: {
      status: 'running',
      result: null,
      error: '',
      errorKind: null,
      elapsedMs: null,
    },
  };
}

function reducer(oldState: AppState, [action, arg]: Action): AppState {
  switch (action) {
    case 'runtimeLoaded':
      return prepareEvaluation({
        ...oldState,
        loadState: { loading: false, value: true },
      });
    case 'runtimeFailed':
      return prepareEvaluation({
        ...oldState,
        loadState: { loading: false, error: arg },
      });
    case 'setPattern':
      return prepareEvaluation({
        ...oldState,
        pattern: arg,
      });
    case 'setInput':
      return prepareEvaluation({
        ...oldState,
        input: arg,
      });
    case 'setOptions': {
      const options = typeof arg === 'function' ? arg(oldState.options) : arg;
      return prepareEvaluation({
        ...oldState,
        options,
      });
    }
    case 'requestSucceeded': {
      if (!oldState.pendingRequest || oldState.pendingRequest.requestId !== arg.requestId) {
        return oldState;
      }

      return {
        ...oldState,
        pendingRequest: null,
        evaluation: {
          status: 'ready',
          result: arg.result,
          error: '',
          errorKind: null,
          elapsedMs: arg.elapsedMs,
        },
      };
    }
    case 'requestFailed': {
      if (!oldState.pendingRequest || oldState.pendingRequest.requestId !== arg.requestId) {
        return oldState;
      }

      return {
        ...oldState,
        pendingRequest: null,
        evaluation: {
          status: 'error',
          result: null,
          error: arg.error,
          errorKind: arg.errorKind,
          elapsedMs: arg.elapsedMs,
        },
      };
    }
  }
}

const initialState: AppState = {
  loadState: { loading: true },
  pattern: defaultPattern,
  input: defaultInput,
  options: DEFAULT_OPTIONS,
  evaluation: idleEvaluationState,
  pendingRequest: null,
  nextRequestId: 0,
};

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const workerRef = useRef<Worker | null>(null);
  const activeRequestRef = useRef<ActiveRequest | null>(null);

  const clearActiveRequest = () => {
    if (activeRequestRef.current) {
      window.clearTimeout(activeRequestRef.current.timeoutId);
      activeRequestRef.current = null;
    }
  };

  const disposeWorker = () => {
    clearActiveRequest();
    workerRef.current?.terminate();
    workerRef.current = null;
  };

  const ensureWorker = () => {
    if (workerRef.current) {
      return workerRef.current;
    }

    const worker = new Worker(new URL('./regexWorker.ts', import.meta.url), { type: 'module' });

    worker.onmessage = (event: MessageEvent<RegexWorkerResponse>) => {
      const message = event.data;
      const activeRequest = activeRequestRef.current;

      if (!activeRequest || activeRequest.requestId !== message.requestId || activeRequest.worker !== worker) {
        return;
      }

      clearActiveRequest();

      if (message.ok) {
        dispatch(['requestSucceeded', {
          requestId: message.requestId,
          result: message.result,
          elapsedMs: message.elapsedMs,
        }]);
        return;
      }

      dispatch(['requestFailed', {
        requestId: message.requestId,
        error: message.error,
        errorKind: message.kind,
        elapsedMs: message.elapsedMs,
      }]);
    };

    worker.onerror = (event) => {
      const activeRequest = activeRequestRef.current;

      if (!activeRequest || activeRequest.worker !== worker) {
        return;
      }

      clearActiveRequest();
      worker.terminate();
      if (workerRef.current === worker) {
        workerRef.current = null;
      }

      dispatch(['requestFailed', {
        requestId: activeRequest.requestId,
        error: event.message || 'Failed to run regex processing in a web worker.',
        errorKind: 'runtime',
        elapsedMs: null,
      }]);
    };

    workerRef.current = worker;
    return worker;
  };

  useEffect(() => {
    const load = async () => {
      try {
        await initPromise;
        dispatch(['runtimeLoaded']);
      } catch (error) {
        dispatch(['runtimeFailed', String(error)]);
      }
    };

    void load();

    return () => {
      disposeWorker();
    };
  }, []);

  useEffect(() => {
    if (!state.pendingRequest) {
      return;
    }

    const request = state.pendingRequest;
    const worker = ensureWorker();
    const timeoutId = window.setTimeout(() => {
      const activeRequest = activeRequestRef.current;
      if (!activeRequest || activeRequest.requestId !== request.requestId || activeRequest.worker !== worker) {
        return;
      }

      clearActiveRequest();
      worker.terminate();
      if (workerRef.current === worker) {
        workerRef.current = null;
      }

      dispatch(['requestFailed', {
        requestId: request.requestId,
        error: 'Regex processing took longer than 3 seconds and was cancelled.',
        errorKind: 'timeout',
        elapsedMs: WORKER_TIMEOUT_MS,
      }]);
    }, WORKER_TIMEOUT_MS);

    activeRequestRef.current = {
      requestId: request.requestId,
      worker,
      timeoutId,
    };

    const message: RegexWorkerRequest = {
      requestId: request.requestId,
      pattern: request.pattern,
      input: request.input,
      options: request.options,
    };

    worker.postMessage(message);

    return () => {
      if (activeRequestRef.current?.requestId === request.requestId) {
        disposeWorker();
      }
    };
  }, [state.pendingRequest]);

  const patternError = state.evaluation.status === 'error' && state.evaluation.errorKind === 'compile'
    ? state.evaluation.error
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
        loadState={state.loadState}
        hasInput={state.input.length > 0}
        invalidPattern={patternError.length > 0}
        isRunning={state.evaluation.status === 'running'}
        errorMessage={state.evaluation.status === 'error' && state.evaluation.errorKind !== 'compile' ? state.evaluation.error : ''}
        result={state.evaluation.status === 'ready' ? state.evaluation.result : null}
        elapsedMs={state.evaluation.elapsedMs}
      />
    </main>
  );
}
