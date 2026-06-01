import { ReactNode } from "preact/compat";
import { MatchingSemanticsTag, MatchingSemanticsValues, RegexOptions, RepetitionBehaviorTag, RepetitionBehaviorValues, WordBoundaryKindTag, WordBoundaryKindValues } from "../.build/plugins/PackageToJS/outputs/Package/bridge-js";
import { Dispatch, StateUpdater } from "preact/hooks";

export function PatternInput({
  pattern,
  setPattern,
  patternError,
  options,
  setOptions,
}: {
  pattern: string;
  setPattern: (pattern: string) => void;
  patternError: string;
  options: RegexOptions;
  setOptions: Dispatch<StateUpdater<RegexOptions>>;
}): ReactNode {
  return <div class="field">
    <div class="field-header">
      <label for="pattern">正規表現パターン</label>
      <button
        class="options-btn"
        type="button"
        popovertarget="options-popup"
      >
        オプション ▼
      </button>
      <OptionsPopup options={options} setOptions={setOptions} />
    </div>
    <input
      id="pattern"
      type="text"
      placeholder={'例: (\\w+)@(\\w+)'}
      spellcheck={false}
      autoComplete="off"
      autoCapitalize="none"
      value={pattern}
      onInput={(event) => setPattern((event.currentTarget as HTMLInputElement).value)}
    />
    <div id="pattern-error" class="field-error" role="alert">
      {patternError}
    </div>
  </div>
}

function OptionsPopup({
  setOptions,
  options,
}: {
  options: RegexOptions;
  setOptions: Dispatch<StateUpdater<RegexOptions>>;
 }): ReactNode {
  return <div
    id="options-popup"
    class="options-popup"
    popover="auto"
  >
    <div class="options-checkboxes">
      {(
        [
          'anchorsMatchLineEndings',
          'asciiOnlyCharacterClasses',
          'asciiOnlyDigits',
          'asciiOnlyWhitespace',
          'asciiOnlyWordCharacters',
          'dotMatchesNewlines',
          'ignoresCase',
        ] as const
      ).map((key) => (
        <label key={key} class="option-checkbox-label">
          <input
            type="checkbox"
            checked={options[key]}
            onChange={() => setOptions((prev) => ({ ...prev, [key]: !prev[key] }))}
          />
          {key}
        </label>
      ))}
    </div>
    <div class="options-selects">
      <div class="option-select-row">
        <label class="option-select-label" for="opt-matchingSemantics">matchingSemantics</label>
        <select
          id="opt-matchingSemantics"
          value={options.matchingSemantics}
          onChange={(e) =>
            setOptions((prev) => ({
              ...prev,
              matchingSemantics: (e.currentTarget as HTMLSelectElement).value as MatchingSemanticsTag,
            }))
          }
        >
          <option value={MatchingSemanticsValues.GraphemeCluster}>{MatchingSemanticsValues.GraphemeCluster}</option>
          <option value={MatchingSemanticsValues.UnicodeScalar}>{MatchingSemanticsValues.UnicodeScalar}</option>
        </select>
      </div>
      <div class="option-select-row">
        <label class="option-select-label" for="opt-repetitionBehavior">repetitionBehavior</label>
        <select
          id="opt-repetitionBehavior"
          value={options.repetitionBehavior}
          onChange={(e) =>
            setOptions((prev) => ({
              ...prev,
              repetitionBehavior: (e.currentTarget as HTMLSelectElement).value as RepetitionBehaviorTag,
            }))
          }
        >
          <option value={RepetitionBehaviorValues.Eager}>{RepetitionBehaviorValues.Eager}</option>
          <option value={RepetitionBehaviorValues.Possessive}>{RepetitionBehaviorValues.Possessive}</option>
          <option value={RepetitionBehaviorValues.Reluctant}>{RepetitionBehaviorValues.Reluctant}</option>
        </select>
      </div>
      <div class="option-select-row">
        <label class="option-select-label" for="opt-wordBoundaryKind">wordBoundaryKind</label>
        <select
          id="opt-wordBoundaryKind"
          value={options.wordBoundaryKind}
          onChange={(e) =>
            setOptions((prev) => ({
              ...prev,
              wordBoundaryKind: (e.currentTarget as HTMLSelectElement).value as WordBoundaryKindTag,
            }))
          }
        >
          <option value={WordBoundaryKindValues.DefaultBoundaries}>{WordBoundaryKindValues.DefaultBoundaries}</option>
          <option value={WordBoundaryKindValues.Simple}>{WordBoundaryKindValues.Simple}</option>
        </select>
      </div>
    </div>
  </div>
}
