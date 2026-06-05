import JavaScriptKit

@JS struct CaptureGroup {
    var name: String
    var value: String
    var unicodeScalarNames: String?
}

@JS struct RegexMatch {
    var value: String
    var unicodeScalarNames: String?
    var groups: [CaptureGroup]
}

@JS struct RegexResult {
    var matches: [RegexMatch]
    var highlightParts: [HighlightPart]
}

@JS struct HighlightPart {
    var text: String
    var marked: Bool
}

@JS struct RegexOptions {
    var anchorsMatchLineEndings: Bool
    var asciiOnlyCharacterClasses: Bool
    var asciiOnlyDigits: Bool
    var asciiOnlyWhitespace: Bool
    var asciiOnlyWordCharacters: Bool
    var dotMatchesNewlines: Bool
    var ignoresCase: Bool
    var matchingSemantics: MatchingSemantics
    var repetitionBehavior: RepetitionBehavior
    var wordBoundaryKind: WordBoundaryKind
}

@JS class SwiftRegex {
    var regex: Regex<AnyRegexOutput>

    init(regex: Regex<AnyRegexOutput>) {
        self.regex = regex
    }

    static func make(pattern: String, options: RegexOptions) throws -> Regex<AnyRegexOutput> {
        let o = options
        return try Regex(pattern)
            .anchorsMatchLineEndings(o.anchorsMatchLineEndings)
            .asciiOnlyCharacterClasses(o.asciiOnlyCharacterClasses)
            .asciiOnlyDigits(o.asciiOnlyDigits)
            .asciiOnlyWhitespace(o.asciiOnlyWhitespace)
            .asciiOnlyWordCharacters(o.asciiOnlyWordCharacters)
            .dotMatchesNewlines(o.dotMatchesNewlines)
            .ignoresCase(o.ignoresCase)
            .matchingSemantics(enum: o.matchingSemantics)
            .repetitionBehavior(enum: o.repetitionBehavior)
            .wordBoundaryKind(enum: o.wordBoundaryKind)
    }

    @JS convenience init(pattern: String, options: RegexOptions) throws(JSException) {
        do {
            self.init(regex: try Self.make(pattern: pattern, options: options))
        } catch {
            throw JSException(message: "\(error)")
        }
    }

    @JS func result(of input: String) -> RegexResult {
        var matches: [RegexMatch] = []
        var parts: [HighlightPart] = []
        var currentIndex = input.startIndex

        for match in input.matches(of: regex) {
            let value = String(input[match.range])
            let groups: [CaptureGroup] = zip(1..., match.output.dropFirst()).compactMap { i, output in
                guard let sub = output.substring else { return nil }
                return CaptureGroup(
                    name: output.name ?? "\(i)",
                    value: String(sub),
                    unicodeScalarNames: sub.unicodeScalarNamesWhenInvisible
                )
            }
            matches.append(RegexMatch(
                value: value,
                unicodeScalarNames: value.unicodeScalarNamesWhenInvisible,
                groups: groups
            ))

            if currentIndex < match.range.lowerBound {
                parts.append(HighlightPart(
                    text: String(input[currentIndex..<match.range.lowerBound]),
                    marked: false
                ))
            }
            parts.append(HighlightPart(
                text: String(input[match.range]),
                marked: true
            ))
            currentIndex = match.range.upperBound
        }

        if currentIndex < input.endIndex {
            parts.append(HighlightPart(
                text: String(input[currentIndex..<input.endIndex]),
                marked: false
            ))
        }

        return RegexResult(matches: matches, highlightParts: parts)
    }
}

@main
struct SwiftRegexTesterApp {
    static func main() {}
}
