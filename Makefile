SWIFT_SDK_ID ?= swift-6.3.1-RELEASE_wasm

.PHONY: test build build-web serve clean-web

test:
	swift test

build:
	swift build

build-web:
	swift package --swift-sdk "$(SWIFT_SDK_ID)" js -c release

serve:
	npm run dev

clean-web:
	rm -rf public/wasm
