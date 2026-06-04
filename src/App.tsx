import { useEffect, useRef, useState } from 'preact/hooks';
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

type ActiveRequest = {
  requestId: number;
  worker: Worker;
  timeoutId: number;
};

const idleEvaluationState: EvaluationState = {
  status: 'idle',
  result: null,
  error: '',
  errorKind: null,
  elapsedMs: null,
};

export function App() {
  const [loadState, setLoadState] = useState<LoadState<true>>({ loading: true });
  const [pattern, setPattern] = useState(defaultPattern);
  const [input, setInput] = useState(defaultInput);
  const [options, setOptions] = useState<RegexOptions>(DEFAULT_OPTIONS);
  const [evaluation, setEvaluation] = useState<EvaluationState>(idleEvaluationState);

  const workerRef = useRef<Worker | null>(null);
  const activeRequestRef = useRef<ActiveRequest | null>(null);
  const workerBusyRef = useRef(false);
  const nextRequestIdRef = useRef(0);

  const clearActiveRequest = () => {
    if (activeRequestRef.current) {
      window.clearTimeout(activeRequestRef.current.timeoutId);
      activeRequestRef.current = null;
    }
    workerBusyRef.current = false;
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
        setEvaluation({
          status: 'ready',
          result: message.result,
          error: '',
          errorKind: null,
          elapsedMs: message.elapsedMs,
        });
        return;
      }

      setEvaluation({
        status: 'error',
        result: null,
        error: message.error,
        errorKind: message.kind,
        elapsedMs: message.elapsedMs,
      });
    };

    worker.onerror = (event) => {
      if (activeRequestRef.current?.worker !== worker) {
        return;
      }

      clearActiveRequest();
      worker.terminate();
      if (workerRef.current === worker) {
        workerRef.current = null;
      }

      setEvaluation({
        status: 'error',
        result: null,
        error: event.message || 'Failed to run regex processing in a web worker.',
        errorKind: 'runtime',
        elapsedMs: null,
      });
    };

    workerRef.current = worker;
    return worker;
  };

  useEffect(() => {
    const load = async () => {
      try {
        await initPromise;
        setLoadState({ loading: false, value: true });
      } catch (error) {
        setLoadState({ loading: false, error: String(error) });
      }
    };

    void load();

    return () => {
      disposeWorker();
    };
  }, []);

  useEffect(() => {
    if (loadState.loading) {
      return;
    }

    if (loadState.error) {
      disposeWorker();
      setEvaluation(idleEvaluationState);
      return;
    }

    if (!input) {
      if (workerBusyRef.current) {
        disposeWorker();
      }
      setEvaluation(idleEvaluationState);
      return;
    }

    if (!pattern) {
      if (workerBusyRef.current) {
        disposeWorker();
      }
      setEvaluation({
        status: 'ready',
        result: EMPTY_RESULT,
        error: '',
        errorKind: null,
        elapsedMs: 0,
      });
      return;
    }

    if (workerBusyRef.current) {
      disposeWorker();
    }

    const worker = ensureWorker();
    const requestId = ++nextRequestIdRef.current;
    const timeoutId = window.setTimeout(() => {
      const activeRequest = activeRequestRef.current;
      if (!activeRequest || activeRequest.requestId !== requestId || activeRequest.worker !== worker) {
        return;
      }

      clearActiveRequest();
      worker.terminate();
      if (workerRef.current === worker) {
        workerRef.current = null;
      }

      setEvaluation({
        status: 'error',
        result: null,
        error: 'Regex processing took longer than 3 seconds and was cancelled.',
        errorKind: 'timeout',
        elapsedMs: WORKER_TIMEOUT_MS,
      });
    }, WORKER_TIMEOUT_MS);

    activeRequestRef.current = { requestId, worker, timeoutId };
    workerBusyRef.current = true;

    setEvaluation({
      status: 'running',
      result: null,
      error: '',
      errorKind: null,
      elapsedMs: null,
    });

    const message: RegexWorkerRequest = {
      requestId,
      pattern,
      input,
      options,
    };

    worker.postMessage(message);
  }, [loadState, pattern, input, options]);

  const patternError = evaluation.status === 'error' && evaluation.errorKind === 'compile'
    ? evaluation.error
    : '';

  return (
    <main>
      <section class="inputs">
        <PatternInput
          pattern={pattern}
          setPattern={setPattern}
          patternError={patternError}
          options={options}
          setOptions={setOptions}
        />

        <TestInput
          input={input}
          setInput={setInput}
        />
      </section>

      <TestResult
        loadState={loadState}
        hasInput={input.length > 0}
        invalidPattern={patternError.length > 0}
        isRunning={evaluation.status === 'running'}
        errorMessage={evaluation.status === 'error' && evaluation.errorKind !== 'compile' ? evaluation.error : ''}
        result={evaluation.status === 'ready' ? evaluation.result : null}
        elapsedMs={evaluation.elapsedMs}
      />
    </main>
  );
}
