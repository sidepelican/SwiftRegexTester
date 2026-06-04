import { useEffect, useMemo, useState } from 'preact/hooks';
import { init } from 'swiftregextester';
import { Exports, HighlightPart, MatchingSemanticsValues, RegexMatch, RegexOptions, RepetitionBehaviorValues, SwiftRegex, WordBoundaryKindValues } from '../.build/plugins/PackageToJS/outputs/Package/bridge-js';
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

const initPromise = init();

const defaultPattern = `(?<year>\\d{4}).(?<month>\\d{1,2}).(?<day>\\d{1,2})`;
const defaultInput = `INVOICE #INV-78492 Issue Date: 2026.6.3
Billing Period: 2026.5.1 - 2026.5.31
Due Date: 2026.6.30
Payment processed on 2026.5.20

Customer ID: CUST3398-三三-九
Total Amount: $1,248.75
Payment Method: Credit Card (**** 4242)
Thank you for your business.
System Generated: 2026-06-03T14:22:07Z
`;

export function App() {
  const [pattern, setPattern] = useState(defaultPattern);
  const [input, setInput] = useState(defaultInput);
  const [runtime, setRuntime] = useState<LoadState<Runtime>>({ loading: true });
  const [options, setOptions] = useState<RegexOptions>(DEFAULT_OPTIONS);

  useEffect(() => {
    const load = async () => {
      try {
        const { exports } = await initPromise;
        setRuntime({
          loading: false,
          value: { swiftExports: exports },
        })
      } catch (error) {
        setRuntime({ loading: false, error: String(error) })
      }
    }
    void load();
  }, []);

  const result = useMemo<{
    patternError: string;
    highlightParts: HighlightPart[];
    matches: RegexMatch[];
  }>(() => {
    if (!runtime.value || !pattern) {
      return {
        patternError: '',
        highlightParts: input ? [{ text: input, marked: false }] : [],
        matches: [] as RegexMatch[],
      }
    }

    let swiftRegex: SwiftRegex
    try {
      swiftRegex = new runtime.value.swiftExports.SwiftRegex(pattern, options);
    } catch (error: unknown) {
      return {
        patternError: (error as Error).message,
        highlightParts: input ? [{ text: input, marked: false }] : [],
        matches: [] as RegexMatch[],
      }
    }

    if (!input) {
      return {
        patternError: '',
        highlightParts: [],
        matches: [] as RegexMatch[],
      }
    }

    const regexResult = swiftRegex.result(input);
    return {
      patternError: '',
      highlightParts: regexResult.highlightParts,
      matches: regexResult.matches,
    }
  }, [input, pattern, runtime, options])

  return (
    <main>
      <section class="inputs">
        <PatternInput
          pattern={pattern}
          setPattern={setPattern}
          patternError={result.patternError}
          options={options}
          setOptions={setOptions}
        />

        <TestInput input={input} setInput={setInput} highlightParts={result.highlightParts} />
      </section>

      <TestResult
        loadState={runtime}
        result={result}
      />
    </main>
  )
}
