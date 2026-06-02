// swift-tools-version: 6.3

import PackageDescription

let package = Package(
    name: "SwiftRegexTester",
    platforms: [.macOS(.v26)],
    dependencies: [
        .package(url: "https://github.com/swiftwasm/JavaScriptKit.git", from: "0.53.0"),
    ],
    targets: [
        .executableTarget(
            name: "SwiftRegexTester",
            dependencies: [
                "JavaScriptKit",
            ],
            swiftSettings: [
                .enableExperimentalFeature("Extern"),
            ],
            plugins: [
                .plugin(name: "BridgeJS", package: "JavaScriptKit"),
            ]
        ),
        .testTarget(
            name: "SwiftRegexTesterTests",
            dependencies: ["SwiftRegexTester"]
        ),
    ],
    swiftLanguageModes: [.v6]
)
