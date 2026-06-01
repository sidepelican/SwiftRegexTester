import { useEffect, useMemo, useState } from 'preact/hooks';
import { init } from 'swiftregextester';
import { Exports, MatchingSemanticsValues, RegexMatch, RegexOptions, RepetitionBehaviorValues, SwiftRegex, WordBoundaryKindValues } from '../.build/plugins/PackageToJS/outputs/Package/bridge-js';
import { buildHighlightParts, HighlightPart } from './HighlightPart';
import { TestResult } from './TestResult';
import { PatternInput } from './PatternInput';
import { TestInput } from './TestInput';

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

export function App() {
  const [pattern, setPattern] = useState('')
  const [input, setInput] = useState('')
  const [runtime, setRuntime] = useState<Runtime | null>(null)
  const [loadError, setLoadError] = useState('')
  const [options, setOptions] = useState<RegexOptions>(DEFAULT_OPTIONS)

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const { exports } = await init();
        if (!alive) return

        setRuntime({
          swiftExports: exports
        })
      } catch (error) {
        if (!alive) return
        setLoadError(String(error))
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  const result = useMemo<{
    patternError: string;
    highlightParts: HighlightPart[];
    showPlaceholder: boolean;
    matches: RegexMatch[];
    showNoMatch: boolean;
  }>(() => {
    if (!runtime) {
      return {
        patternError: '',
        highlightParts: [] as HighlightPart[],
        showPlaceholder: false,
        matches: [] as RegexMatch[],
        showNoMatch: false,
      }
    }

    if (!pattern) {
      return {
        patternError: '',
        highlightParts: input ? [{ text: input, marked: false }] : [],
        showPlaceholder: input.length === 0,
        matches: [] as RegexMatch[],
        showNoMatch: false,
      }
    }

    let swiftRegex: SwiftRegex
    try {
      swiftRegex = new runtime.swiftExports.SwiftRegex(pattern, options);
    } catch (error: unknown) {
      return {
        patternError: (error as Error).message,
        highlightParts: input ? [{ text: input, marked: false }] : [],
        showPlaceholder: input.length === 0,
        matches: [] as RegexMatch[],
        showNoMatch: false,
      }
    }

    if (!input) {
      return {
        patternError: '',
        highlightParts: [],
        showPlaceholder: true,
        matches: [] as RegexMatch[],
        showNoMatch: false,
      }
    }

    const matches = swiftRegex.matches(input);
    return {
      patternError: '',
      highlightParts: buildHighlightParts(input, matches),
      showPlaceholder: matches.length === 0 && input.length === 0,
      matches,
      showNoMatch: matches.length === 0,
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

          <TestInput input={input} setInput={setInput} />
      </section>

      <TestResult
        hasRuntime={runtime !== null}
        loadError={loadError}
        result={result}
      />
    </main>
  )
}
