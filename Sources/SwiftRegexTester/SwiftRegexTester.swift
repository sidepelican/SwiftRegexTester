import JavaScriptKit

@JS struct CaptureGroup {
    var name: String
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

@JS struct HighlightPart {
    var text: String
    var marked: Bool
}

@JS enum MatchingSemantics: String {
    case graphemeCluster
    case unicodeScalar
}

@JS enum RepetitionBehavior: String {
    case eager
    case possessive
    case reluctant
}

@JS enum WordBoundaryKind: String {
    case simple
    case defaultBoundaries = "default"
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

    @JS func matches(of input: String) -> [RegexMatch] {
        return input.matches(of: regex).map { match in
            let value = String(input[match.range])
            let start = input.distance(from: input.startIndex, to: match.range.lowerBound)
            let end   = input.distance(from: input.startIndex, to: match.range.upperBound)
            let groups: [CaptureGroup] = zip(1..., match.output.dropFirst()).compactMap { i, output in
                guard let sub = output.substring else { return nil }
                let gStart = input.distance(from: input.startIndex, to: sub.startIndex)
                let gEnd   = input.distance(from: input.startIndex, to: sub.endIndex)
                return CaptureGroup(
                    name: output.name ?? "\(i)",
                    value: String(sub),
                    start: gStart,
                    end: gEnd
                )
            }
            return RegexMatch(value: value, start: start, end: end, groups: groups)
        }
    }

    @JS func highlightParts(of input: String) -> [HighlightPart] {
        var parts: [HighlightPart] = []
        var currentIndex = input.startIndex

        for match in input.matches(of: regex) {
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

        return parts
    }
}

extension Regex {
     func matchingSemantics(enum enumSemanticLevel: MatchingSemantics) -> Regex<Regex<Output>.RegexOutput> {
        switch enumSemanticLevel {
        case .graphemeCluster: return self.matchingSemantics(.graphemeCluster)
        case .unicodeScalar:   return self.matchingSemantics(.unicodeScalar)
        }
     }

     func repetitionBehavior(enum enumRepetitionBehavior: RepetitionBehavior) -> Regex<Regex<Output>.RegexOutput> {
        switch enumRepetitionBehavior {
        case .eager:      return self.repetitionBehavior(.eager)
        case .possessive: return self.repetitionBehavior(.possessive)
        case .reluctant:  return self.repetitionBehavior(.reluctant)
        }
     }

     func wordBoundaryKind(enum enumWordBoundaryKind: WordBoundaryKind) -> Regex<Regex<Output>.RegexOutput> {
        switch enumWordBoundaryKind {
        case .simple:            return self.wordBoundaryKind(.simple)
        case .defaultBoundaries: return self.wordBoundaryKind(.default)
        }
     }
}

@main
struct SwiftRegexTesterApp {
    static func main() {}
}
