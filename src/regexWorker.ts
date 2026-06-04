import { init } from 'swiftregextester';
import type { Exports, RegexResult } from '../.build/plugins/PackageToJS/outputs/Package/bridge-js';
import type { RegexWorkerRequest, RegexWorkerResponse } from './regexWorkerProtocol';

const initPromise = init();
const emptyResult: RegexResult = { highlightParts: [], matches: [] };
let exportsPromise: Promise<Exports> | null = null;

function getExports(): Promise<Exports> {
  exportsPromise ??= initPromise.then(({ exports }) => exports);
  return exportsPromise;
}

self.onmessage = async (event: MessageEvent<RegexWorkerRequest>) => {
  const { requestId, pattern, input, options } = event.data;
  const startTime = performance.now();

  try {
    if (!pattern) {
      const response: RegexWorkerResponse = {
        requestId,
        ok: true,
        result: emptyResult,
        elapsedMs: performance.now() - startTime,
      };
      self.postMessage(response);
      return;
    }

    const exports = await getExports();
    let regex: InstanceType<Exports['SwiftRegex']> | null = null;

    try {
      regex = new exports.SwiftRegex(pattern, options);
    } catch (error) {
      const response: RegexWorkerResponse = {
        requestId,
        ok: false,
        kind: 'compile',
        error: error instanceof Error ? error.message : String(error),
        elapsedMs: performance.now() - startTime,
      };
      self.postMessage(response);
      return;
    }

    try {
      const response: RegexWorkerResponse = {
        requestId,
        ok: true,
        result: regex.result(input),
        elapsedMs: performance.now() - startTime,
      };
      self.postMessage(response);
    } catch (error) {
      const response: RegexWorkerResponse = {
        requestId,
        ok: false,
        kind: 'runtime',
        error: error instanceof Error ? error.message : String(error),
        elapsedMs: performance.now() - startTime,
      };
      self.postMessage(response);
    } finally {
      regex.release();
    }
  } catch (error) {
    const response: RegexWorkerResponse = {
      requestId,
      ok: false,
      kind: 'runtime',
      error: error instanceof Error ? error.message : String(error),
      elapsedMs: performance.now() - startTime,
    };
    self.postMessage(response);
  }
};
