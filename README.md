# SwiftRegexTester

Swift標準ライブラリのRegex機能をブラウザから試すための、Swift/Wasm + Vite 構成です。

## 含まれているもの

- `./.codex/skills/`: `swiftwasm/Swift-Wasm-Agent-Skill` から導入したスキル
- `./.github/workflows/copilot-setup-steps.yml`: Copilot Cloud Agent向けのNode.js + Swift Wasm SDKセットアップ
- `Package.swift`: JavaScriptKit / BridgeJS を使う SwiftPM 設定
- `Makefile`: ネイティブテスト・Wasmビルド
- `src/main.js`: Swift/Wasm で公開された `hello()` を呼び出して表示する Vite エントリ

## セットアップ

1. Wasm SDKを入れます。

   ```bash
   cd <project-directory>
   version="$(swift --version | sed -n 's/^Swift version \([0-9.]*\).*/\1/p')"
   tag="swift-${version}-RELEASE"
   url="https://download.swift.org/swift-${version}-release/wasm-sdk/${tag}/${tag}_wasm.artifactbundle.tar.gz"
   archive="$(mktemp)"
   curl -fsSL "$url" -o "$archive"
   swift sdk install "$archive"
   rm -f "$archive"
   ```

2. 表示された SDK ID を確認します。

   ```bash
   swift sdk list
   ```

3. ネイティブのテストを実行します。

   ```bash
   make test
   ```

4. Vite の依存関係をインストールします。

   ```bash
   npm install
   ```

5. Wasm 向けにビルドし、Vite / Cloudflare Pages が配信する `./public/wasm` へ配置します。

   ```bash
   make build-web SWIFT_SDK_ID="<swift-sdk-id>"
   ```

   `public/wasm` は Cloudflare Pages に含める配布物です。Swift 側を変更したら、この手順を再実行して生成された `public/wasm` の差分も一緒にコミットしてください。

6. Vite 開発サーバーを起動します。

   ```bash
   npm run dev
   ```

7. `http://localhost:5173` を開くと、Swift の `hello()` が返す文字列を確認できます。

## Cloudflare Pages へのデプロイ

Cloudflare Pages のビルド環境では Swift/Wasm をその場で生成しないため、デプロイ時はリポジトリに含まれる `public/wasm` がそのまま `dist/wasm` へコピーされます。

そのため、Pages へデプロイする前に次を満たしてください。

1. `make build-web SWIFT_SDK_ID="<swift-sdk-id>"` を実行済みであること
2. 生成された `public/wasm` をコミット済みであること
3. その状態で `npm run build` を実行し、`dist/wasm/index.js` が含まれること
