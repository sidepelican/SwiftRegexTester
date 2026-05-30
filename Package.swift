// swift-tools-version: 6.3
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "SwiftRegexTester",
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
