import JavaScriptKit

// MARK: - Exported class

@JS final class SwiftRegex {
    let _regex: Regex<AnyRegexOutput>?
    let _error: String?

    @JS init(pattern: String) {
        do {
            _regex = try Regex(pattern)
            _error = nil
        } catch {
            _regex = nil
            _error = "\(error)"
        }
    }

    @JS func isValid() -> Bool {
        _error == nil
    }

    @JS func errorMessage() -> String {
        _error ?? ""
    }
}

// MARK: - Exported functions

/// Compile a regex pattern and return a SwiftRegex object.
@JS func createRegex(pattern: String) -> SwiftRegex {
    SwiftRegex(pattern: pattern)
}

/// Run all matches of the regex against `input` and return a JSON string.
///
/// Success: `{"matches":[{"value":"…","start":N,"end":N,"groups":[…]},…]}`
/// Error:   `{"error":"…"}`
@JS func testRegex(regex: SwiftRegex, input: String) -> String {
    guard let r = regex._regex else {
        return "{\"error\":\(jsonEscape(regex._error ?? ""))}"
    }

    let matches = input.matches(of: r)

    var matchParts: [String] = []
    for match in matches {
        let value = String(input[match.range])
        let start = input.distance(from: input.startIndex, to: match.range.lowerBound)
        let end   = input.distance(from: input.startIndex, to: match.range.upperBound)

        // Capture groups: output[0] is the whole match, output[1…] are groups
        let output = match.output
        var groupParts: [String] = []
        if output.count > 1 {
            for i in 1..<output.count {
                if let sub = output[i].value as? Substring {
                    let gStart = input.distance(from: input.startIndex, to: sub.startIndex)
                    let gEnd   = input.distance(from: input.startIndex, to: sub.endIndex)
                    groupParts.append("{\"value\":\(jsonEscape(String(sub))),\"start\":\(gStart),\"end\":\(gEnd)}")
                } else {
                    groupParts.append("null")
                }
            }
        }

        let groups = "[" + groupParts.joined(separator: ",") + "]"
        matchParts.append(
            "{\"value\":\(jsonEscape(value)),\"start\":\(start),\"end\":\(end),\"groups\":\(groups)}"
        )
    }

    return "{\"matches\":[\(matchParts.joined(separator: ","))]}"
}

// MARK: - Helpers

private func jsonEscape(_ s: String) -> String {
    var result = "\""
    for scalar in s.unicodeScalars {
        switch scalar.value {
        case 0x22: result += "\\\""
        case 0x5C: result += "\\\\"
        case 0x0A: result += "\\n"
        case 0x0D: result += "\\r"
        case 0x09: result += "\\t"
        case 0x08: result += "\\b"
        case 0x0C: result += "\\f"
        default:
            if scalar.value < 0x20 {
                let hex = String(scalar.value, radix: 16)
                let padded = String(repeating: "0", count: 4 - hex.count) + hex
                result += "\\u\(padded)"
            } else {
                result.unicodeScalars.append(scalar)
            }
        }
    }
    result += "\""
    return result
}

// MARK: - Entry point

@main
struct SwiftRegexTesterApp {
    static func main() {}
}
