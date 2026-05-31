SWIFT_SDK_ID ?= swift-6.3.1-RELEASE_wasm

.PHONY: test build build-web serve

test:
	swift test

build:
	swift build

build-web:
	swift package --swift-sdk "$(SWIFT_SDK_ID)" js -c release

serve:
	npm run dev
