# SwiftRegexTester

Swift標準ライブラリのRegex機能をブラウザから試すための、Swift/Wasm + Vite 構成です。

## 含まれているもの

- `./.codex/skills/`: `swiftwasm/Swift-Wasm-Agent-Skill` から導入したスキル
- `./.github/workflows/copilot-setup-steps.yml`: Copilot Cloud Agent向けのNode.js + Swift Wasm SDKセットアップ
- `Package.swift`: JavaScriptKit / BridgeJS を使う SwiftPM 設定
- `Makefile`: ネイティブテスト・Wasmビルド
- `src/main.tsx`: Preact + TypeScript で Swift/Wasm の Regex テスター UI を構成する Vite エントリ

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

5. Wasm 向けにビルドし、Vite が配信する `./public/wasm` へ配置します。

   ```bash
   make build-web SWIFT_SDK_ID="<swift-sdk-id>"
   ```

   このビルドでは、静的配信環境でも読み込めるように WASI shim を CDN URL 参照で出力します。

   `public/wasm` はローカル確認や CI ビルド用の中間生成物で、Git にはコミットしません。

6. Vite 開発サーバーを起動します。

   ```bash
   npm run dev
   ```

7. `http://localhost:5173` を開くと、Swift の `hello()` が返す文字列を確認できます。

## Cloudflare Pages へのデプロイ

`main` へ push すると GitHub Actions の `Deploy Pages Branch` が次を実行します。

1. Swift WebAssembly SDK をインストール
2. `make test`
3. `make build-web`
4. `public/wasm` 配下の `.wasm` ファイルへ `wasm-strip` と `wasm-opt -Oz --all-features --disable-gc --disable-typed-function-references` を適用
5. `npm run build`
6. 生成された `dist/` を `deploy` ブランチへ force-push

Cloudflare Pages 側では、ビルド元ブランチを `deploy` に設定してください。`deploy` ブランチにはビルド済みの静的ファイルだけが置かれる想定です。

この方式では、Swift/Wasm の生成物を `main` ブランチへコミットする必要はありません。

## PR staging

`pull_request` イベントでは `Deploy PR Staging Branch` が次を実行します。

1. `make test`
2. `make build-web`
3. `npm run build`
4. `dist/` を `staging/pr-<PR番号>` ブランチへ force-push
5. PR コメントへ staging 情報を追記

Cloudflare API トークンは不要です。Cloudflare Pages は Git 連携で `staging/*` ブランチを Preview としてデプロイしてください。

- 本番: `deploy` ブランチ
- Preview: `staging/*` ブランチ

PR を close すると `staging/pr-<PR番号>` ブランチは自動削除されます。

PR コメントには `https://<branch-slug>.swift-regex-tester.pages.dev` 形式の Preview URL を表示します。

fork からの PR は `GITHUB_TOKEN` の制限により `staging/*` へ push しません。
