import { Fragment, ReactNode } from "preact/compat";
import { HighlightPart } from "./HighlightPart";
import { useRef } from "preact/hooks";

export function TestInput({
  input,
  setInput,
  highlightParts,
}: {
  input: string;
  setInput: (input: string) => void;
  highlightParts: HighlightPart[];
}): ReactNode {
  const highlightRef = useRef<HTMLDivElement>(null);

  const syncScroll = (textarea: HTMLTextAreaElement) => {
    if (!highlightRef.current) return;
    highlightRef.current.scrollTop = textarea.scrollTop;
    highlightRef.current.scrollLeft = textarea.scrollLeft;
  };

  return <div class="field">
    <label for="teststr">テスト文字列</label>
    <div class="textarea-highlight-wrap">
      <div class="textarea-highlight" ref={highlightRef} aria-hidden="true">
        {input.length === 0 && <span class="placeholder">テストする文字列を入力してください</span>}
        {highlightParts.map((part, index) =>
          part.marked ? <mark key={index}>{part.text}</mark> : <Fragment key={index}>{part.text}</Fragment>,
        )}
      </div>
      <textarea
        class="textarea-editor"
        id="teststr"
        rows={6}
        spellcheck={false}
        value={input}
        onInput={(event) => setInput((event.currentTarget as HTMLTextAreaElement).value)}
        onScroll={(event) => syncScroll(event.currentTarget as HTMLTextAreaElement)}
      />
    </div>
  </div>
}
