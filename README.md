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
4. `npm run build`
5. 生成された `dist/` を `deploy` ブランチへ force-push

Cloudflare Pages 側では、ビルド元ブランチを `deploy` に設定してください。`deploy` ブランチにはビルド済みの静的ファイルだけが置かれる想定です。

この方式では、Swift/Wasm の生成物を `main` ブランチへコミットする必要はありません。
