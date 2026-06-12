# Swift Regex Tester

A playground for Swift's `Regex` in the browser, powered by WebAssembly.

## Development

### Prerequisites

- [swiftly](https://github.com/swiftwasm/swiftly)

### Setup

1. Install Swift toolchain and SDK:
   ```sh
   swiftly install
   ./setup-swift-sdk.sh
   ```
2. Install npm dependencies:
   ```sh
   npm install
   ```

### Build & Run

1. Build the Swift npm package:
   ```sh
   swiftly run swift package --swift-sdk $(./setup-swift-sdk.sh) js
   ```
2. Run the web dev server:
   ```sh
   npm run dev
   ```


