import JavaScriptKit

// MARK: - Supporting value types

@JS struct CaptureGroup {
    var value: String
    var start: Int
    var end: Int
}

@JS struct RegexMatch {
    var value: String
    var start: Int
    var end: Int
    var groups: [CaptureGroup]
}

// MARK: - Exported class

/// Holds a compiled `Regex`. Created by `createRegex(pattern:)`.
@JS final class SwiftRegex {
    var _regex: Regex<AnyRegexOutput>?

    /// Dummy initializer required by BridgeJS. Use `createRegex(pattern:)` instead.
    @JS init() { _regex = nil }

    init(_ regex: Regex<AnyRegexOutput>) { _regex = regex }
}

// MARK: - Result enums

@JS enum RegexCompileResult {
    case success(SwiftRegex)
    case failure(String)
}

@JS enum RegexTestResult {
    case success([RegexMatch])
    case failure(String)
}

// MARK: - Exported functions

/// Compile a regex pattern. Returns `.success` with a `SwiftRegex` or `.failure` with an error message.
@JS func createRegex(pattern: String) -> RegexCompileResult {
    do {
        return .success(SwiftRegex(try Regex(pattern)))
    } catch {
        return .failure("\(error)")
    }
}

/// Run all matches of `regex` against `input`.
/// Returns `.success` with an array of `RegexMatch`, or `.failure` with an error message.
@JS func testRegex(regex: SwiftRegex, input: String) -> RegexTestResult {
    guard let r = regex._regex else {
        return .failure("Regex is not compiled")
    }

    var matches: [RegexMatch] = []
    for match in input.matches(of: r) {
        let value = String(input[match.range])
        let start = input.distance(from: input.startIndex, to: match.range.lowerBound)
        let end   = input.distance(from: input.startIndex, to: match.range.upperBound)

        var groups: [CaptureGroup] = []
        let output = match.output
        if output.count > 1 {
            for i in 1..<output.count {
                if let sub = output[i].value as? Substring {
                    let gStart = input.distance(from: input.startIndex, to: sub.startIndex)
                    let gEnd   = input.distance(from: input.startIndex, to: sub.endIndex)
                    groups.append(CaptureGroup(value: String(sub), start: gStart, end: gEnd))
                }
            }
        }

        matches.append(RegexMatch(value: value, start: start, end: end, groups: groups))
    }

    return .success(matches)
}

// MARK: - Entry point

@main
struct SwiftRegexTesterApp {
    static func main() {}
}
