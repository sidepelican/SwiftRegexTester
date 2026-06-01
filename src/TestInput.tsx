import { ReactNode } from "preact/compat";

export function TestInput({
  input,
  setInput,
}: {
  input: string;
  setInput: (input: string) => void;
}): ReactNode {
  return <div class="field">
    <label for="teststr">テスト文字列</label>
    <textarea
      id="teststr"
      rows={6}
      placeholder="テストする文字列を入力してください"
      value={input}
      onInput={(event) => setInput((event.currentTarget as HTMLTextAreaElement).value)}
    />
  </div>
}
