#!/bin/bash
set -e

SWIFT_SDK_ID=6.3-RELEASE-wasm32-unknown-wasip1-threads

if ! swift sdk list | grep -q "$SWIFT_SDK_ID"; then
  echo "Installing Swift SDK $SWIFT_SDK_ID..." >&2
  swift sdk install https://github.com/swiftwasm/swift/releases/download/swift-wasm-6.3-RELEASE/swift-wasm-6.3-RELEASE-wasm32-unknown-wasip1-threads.artifactbundle.zip --checksum a09a0eed0fef420b4b8bb03e4dc0e7e2653ab6c88b44cb4f359ef06063b35c39 >&2
else
  echo "Swift SDK \"$SWIFT_SDK_ID\" is already installed." >&2
fi

if [ -n "$GITHUB_OUTPUT" ]; then
  echo "SWIFT_SDK_ID=$SWIFT_SDK_ID" >> "$GITHUB_OUTPUT"
fi

echo "$SWIFT_SDK_ID"
