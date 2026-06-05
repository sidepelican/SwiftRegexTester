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
    var executionMode: MatchExecutionMode
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

struct SwiftRegex {
    var regex: Regex<AnyRegexOutput>
    var executionMode: MatchExecutionMode

    init(regex: Regex<AnyRegexOutput>, executionMode: MatchExecutionMode) {
        self.regex = regex
        self.executionMode = executionMode
    }
    
    init(pattern: String, options: RegexOptions) throws {
        let o = options
        let regex = try Regex(pattern)
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
        self.init(regex: regex, executionMode: o.executionMode)
    }

    func result(of input: String) -> RegexResult {
        var matches: [RegexMatch] = []
        var parts: [HighlightPart] = []
        var currentIndex = input.startIndex

        let rawMatches: [Regex<AnyRegexOutput>.Match] = switch executionMode {
        case .firstMatch:
            if let match = input.firstMatch(of: regex) {
                [match]
            } else { 
                [] 
            }
        case .allMatches:
            input.matches(of: regex)
        }

        for match in rawMatches {
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
