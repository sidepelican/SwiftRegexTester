SWIFT_SDK_ID ?= swift-6.3.1-RELEASE_wasm
WASM_OUTPUT_DIR := .build/plugins/PackageToJS/outputs/Package

.PHONY: test build build-web serve clean-web

test:
	swift test

build:
	swift build

build-web:
	swift package --swift-sdk "$(SWIFT_SDK_ID)" js
	rm -rf wasm
	mkdir -p wasm
	cp -R "$(WASM_OUTPUT_DIR)"/. wasm/

serve:
	python3 -m http.server 8000

clean-web:
	rm -rf wasm
