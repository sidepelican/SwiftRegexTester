import { ReactNode } from 'preact/compat';

export function TestInput({
  input,
  setInput,
}: {
  input: string;
  setInput: (input: string) => void;
}): ReactNode {
  return (
    <div class="field">
      <label for="teststr">Test string</label>
      <textarea
        id="teststr"
        spellcheck={false}
        placeholder="Enter text to test"
        value={input}
        onInput={(event) => setInput((event.currentTarget as HTMLTextAreaElement).value)}
      />
    </div>
  )
}
