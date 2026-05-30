# SwiftRegexTester

Swift標準ライブラリのRegex機能をブラウザから試すための、Swift/Wasm + BridgeJSベースの最小構成です。

## 含まれているもの

- `./.codex/skills/`: `swiftwasm/Swift-Wasm-Agent-Skill` から導入したスキル
- `./.github/workflows/copilot-setup-steps.yml`: Copilot Cloud Agent向けのNode.js + Swift Wasm SDKセットアップ
- `Package.swift`: JavaScriptKit / BridgeJS を使う SwiftPM 設定
- `Makefile`: ネイティブテスト・Wasmビルド・静的配信用アセット配置
- `index.html`: `./wasm` 配下のビルド成果物を読み込んで `hello()` を表示する静的ページ
- `vendor/browser_wasi_shim/`: ブラウザ用WASIランタイムのローカル配信用ファイル

## セットアップ

1. Wasm SDKを入れます。

   ```bash
   cd <project-directory>
   version="$(swift --version | sed -n 's/^Swift version \\([0-9.]*\\).*/\\1/p')"
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

4. Wasm 向けにビルドし、静的配信用の `./wasm` へ配置します。

   ```bash
   make build-web SWIFT_SDK_ID="<swift-sdk-id>"
   ```

5. ルートディレクトリを静的配信します。

   ```bash
   make serve
   ```

6. `http://localhost:8000` を開くと、Swift の `hello()` が返す文字列を確認できます。
