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
] as const;

const OPTION_HELP: Record<keyof RegexOptions, string> = {
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
  const [openHelpId, setOpenHelpId] = useState<string | null>(null);

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
      {CHECKBOX_OPTION_KEYS.map((key) => {
        const inputId = `opt-${key}`;
        return <div key={key} class="option-checkbox-item">
          <label for={inputId} class="option-checkbox-label">
            {key}
          </label>
          <div class="option-checkbox-controls">
          <input
            id={inputId}
            type="checkbox"
            checked={options[key]}
            onChange={() => setOptions((prev) => ({ ...prev, [key]: !prev[key] }))}
          />
          <HelpPopover
            optionName={key}
            description={OPTION_HELP[key]}
            openHelpId={openHelpId}
            setOpenHelpId={setOpenHelpId}
          />
          </div>
        </div>
      })}
    </div>
    <div class="options-selects">
      <div class="option-select-row">
        <div class="option-select-header">
          <label class="option-select-label" for="opt-matchingSemantics">matchingSemantics</label>
          <HelpPopover
            optionName="matchingSemantics"
            description={OPTION_HELP.matchingSemantics}
            openHelpId={openHelpId}
            setOpenHelpId={setOpenHelpId}
          />
        </div>
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
        <div class="option-select-header">
          <label class="option-select-label" for="opt-repetitionBehavior">repetitionBehavior</label>
          <HelpPopover
            optionName="repetitionBehavior"
            description={OPTION_HELP.repetitionBehavior}
            openHelpId={openHelpId}
            setOpenHelpId={setOpenHelpId}
          />
        </div>
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
        <div class="option-select-header">
          <label class="option-select-label" for="opt-wordBoundaryKind">wordBoundaryKind</label>
          <HelpPopover
            optionName="wordBoundaryKind"
            description={OPTION_HELP.wordBoundaryKind}
            openHelpId={openHelpId}
            setOpenHelpId={setOpenHelpId}
          />
        </div>
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

function HelpPopover({
  optionName,
  description,
  openHelpId,
  setOpenHelpId,
}: {
  optionName: string;
  description: string;
  openHelpId: string | null;
  setOpenHelpId: Dispatch<StateUpdater<string | null>>;
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
