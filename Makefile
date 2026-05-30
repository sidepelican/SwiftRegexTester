SWIFT_SDK_ID ?= swift-6.3.1-RELEASE_wasm
WASM_OUTPUT_DIR := .build/plugins/PackageToJS/outputs/Package

.PHONY: test build build-web serve clean-web

test:
	swift test

build:
	swift build

build-web:
	swift package --swift-sdk "$(SWIFT_SDK_ID)" js
	rm -rf public/wasm
	mkdir -p public/wasm
	cp -R "$(WASM_OUTPUT_DIR)"/. public/wasm/

serve:
	npm run dev

clean-web:
	rm -rf public/wasm
