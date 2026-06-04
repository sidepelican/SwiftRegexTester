import type { RegexOptions, RegexResult } from '../.build/plugins/PackageToJS/outputs/Package/bridge-js';

export type RegexWorkerRequest = {
  requestId: number;
  pattern: string;
  input: string;
  options: RegexOptions;
};

export type RegexWorkerResponse =
  | {
      requestId: number;
      ok: true;
      result: RegexResult;
      elapsedMs: number;
    }
  | {
      requestId: number;
      ok: false;
      kind: 'compile' | 'runtime';
      error: string;
      elapsedMs: number;
    };
