import { ReactNode } from "preact/compat";
import { MatchingSemanticsTag, MatchingSemanticsValues, RegexOptions, RepetitionBehaviorTag, RepetitionBehaviorValues, WordBoundaryKindTag, WordBoundaryKindValues } from "../.build/plugins/PackageToJS/outputs/Package/bridge-js";
import { Dispatch, StateUpdater, useEffect, useState } from "preact/hooks";

const CHECKBOX_OPTION_KEYS = [
  "anchorsMatchLineEndings",
  "asciiOnlyCharacterClasses",
  "asciiOnlyDigits",
  "asciiOnlyWhitespace",
  "asciiOnlyWordCharacters",
  "dotMatchesNewlines",
  "ignoresCase",
] satisfies RegexOptionKey[];

type RegexOptionKey = keyof RegexOptions;

const OPTION_HELP: Record<RegexOptionKey, string> = {
  anchorsMatchLineEndings: "Makes ^ and $ match at line boundaries, not only at the start and end of the entire input.",
  asciiOnlyCharacterClasses: "Limits regex character classes such as \\w, \\d, and \\s to ASCII behavior.",
  asciiOnlyDigits: "Treats digit matching as ASCII-only (0-9) instead of full Unicode decimal digits.",
  asciiOnlyWhitespace: "Treats whitespace matching as ASCII-only instead of the full Unicode whitespace set.",
  asciiOnlyWordCharacters: "Treats word characters as ASCII-only (letters, digits, underscore) for word-related matching.",
  dotMatchesNewlines: "Allows . to match newline characters too, instead of stopping at line breaks.",
  ignoresCase: "Enables case-insensitive matching.",
  matchingSemantics: "Chooses whether matching works by grapheme clusters (user-perceived characters) or Unicode scalars.",
  repetitionBehavior: "Controls quantifier behavior: eager (greedy), reluctant (lazy), or possessive (no backtracking).",
  wordBoundaryKind: "Selects how word boundaries are determined (default Unicode-aware boundaries or simpler ones).",
};

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
    <label for="pattern">Regex pattern</label>
    <input
      id="pattern"
      type="text"
      placeholder={"Example: (\\w+)@(\\w+)"}
      spellcheck={false}
      autoComplete="off"
      autoCapitalize="none"
      value={pattern}
      onInput={(event) => setPattern((event.currentTarget as HTMLInputElement).value)}
    />
    {patternError && <div id="pattern-error" class="field-error" role="alert">
      {patternError}
    </div>}
    <details class="options-accordion">
      <summary class="options-btn">Options</summary>
      <div class="options-panel">
        <OptionsPanel options={options} setOptions={setOptions} />
      </div>
    </details>
  </div>
}

function OptionsPanel({
  setOptions,
  options,
}: {
  options: RegexOptions;
  setOptions: Dispatch<StateUpdater<RegexOptions>>;
}): ReactNode {
  const [openHelpId, setOpenHelpId] = useState<RegexOptionKey | null>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(".option-help")) return;
      setOpenHelpId(null);
    };

    document.addEventListener("click", closeOnOutsideClick);
    return () => document.removeEventListener("click", closeOnOutsideClick);
  }, []);

  return <div
    id="options-popup"
    class="options-popup"
  >
    <div class="options-checkboxes">
      {CHECKBOX_OPTION_KEYS.map((key) =>
        <CheckboxOption
          key={key}
          optionKey={key}
          options={options}
          setOptions={setOptions}
          openHelpId={openHelpId}
          setOpenHelpId={setOpenHelpId}
        />
      )}
    </div>
    <div class="options-selects">
      <SelectOption
        optionKey="matchingSemantics"
        values={[MatchingSemanticsValues.GraphemeCluster, MatchingSemanticsValues.UnicodeScalar]}
        options={options}
        setOptions={setOptions}
        openHelpId={openHelpId}
        setOpenHelpId={setOpenHelpId}
      />
      <SelectOption
        optionKey="repetitionBehavior"
        values={[RepetitionBehaviorValues.Eager, RepetitionBehaviorValues.Possessive, RepetitionBehaviorValues.Reluctant]}
        options={options}
        setOptions={setOptions}
        openHelpId={openHelpId}
        setOpenHelpId={setOpenHelpId}
      />
      <SelectOption
        optionKey="wordBoundaryKind"
        values={[WordBoundaryKindValues.DefaultBoundaries, WordBoundaryKindValues.Simple]}
        options={options}
        setOptions={setOptions}
        openHelpId={openHelpId}
        setOpenHelpId={setOpenHelpId}
      />
    </div>
  </div>
}

function CheckboxOption({
  optionKey,
  openHelpId,
  setOpenHelpId,
  options,
  setOptions,
}: {
  optionKey: RegexOptionKey;
  options: RegexOptions;
  setOptions: Dispatch<StateUpdater<RegexOptions>>;
  openHelpId: RegexOptionKey | null;
  setOpenHelpId: Dispatch<StateUpdater<RegexOptionKey | null>>;
}) {
  const inputId = `opt-${optionKey}`;
  return <div key={optionKey} class="option-checkbox-item">
    <label for={inputId} class="option-checkbox-label">
      {optionKey}
    </label>
    <div class="option-checkbox-controls">
      <input
        id={inputId}
        type="checkbox"
        checked={!!options[optionKey]}
        onChange={() => setOptions((prev) => ({ ...prev, [optionKey]: !prev[optionKey] }))}
      />
      <HelpPopover
        optionName={optionKey}
        description={OPTION_HELP[optionKey]}
        openHelpId={openHelpId}
        setOpenHelpId={setOpenHelpId}
      />
    </div>
  </div>
}

function SelectOption({
  optionKey,
  values,
  openHelpId,
  setOpenHelpId,
  options,
  setOptions,
}: {
  optionKey: RegexOptionKey;
  values: string[];
  options: RegexOptions;
  setOptions: Dispatch<StateUpdater<RegexOptions>>;
  openHelpId: RegexOptionKey | null;
  setOpenHelpId: Dispatch<StateUpdater<RegexOptionKey | null>>;
}) {
  const inputId = `opt-${optionKey}`;
  return <div class="option-select-row">
    <label class="option-select-label" for={inputId}>{optionKey}</label>
    <div class="option-select-container">
      <select
        id={inputId}
        value={options[optionKey] as string}
        onChange={(e) =>
          setOptions((prev) => ({
            ...prev,
            [optionKey]: (e.currentTarget as HTMLSelectElement).value as any,
          }))
        }
      >
        {values.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      <HelpPopover
        optionName={optionKey}
        description={OPTION_HELP[optionKey]}
        openHelpId={openHelpId}
        setOpenHelpId={setOpenHelpId}
      />
    </div>
  </div>
}

function HelpPopover({
  optionName,
  description,
  openHelpId,
  setOpenHelpId,
}: {
  optionName: RegexOptionKey;
  description: string;
  openHelpId: RegexOptionKey | null;
  setOpenHelpId: Dispatch<StateUpdater<RegexOptionKey | null>>;
}): ReactNode {
  const isOpen = openHelpId === optionName;

  return <span
    class={`option-help ${isOpen ? "is-open" : ""}`}
  >
    <button
      type="button"
      class="option-help-trigger"
      aria-label={`Help for ${optionName}`}
      aria-expanded={isOpen}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setOpenHelpId((prev) => (prev === optionName ? null : optionName));
      }}
    >
      ?
    </button>
    <span role="tooltip" class="option-help-popover">
      {description}
    </span>
  </span>
}
