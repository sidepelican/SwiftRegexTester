import JavaScriptKit

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

    @JS init(pattern: String, options: RegexOptions) throws(JSException) {
        do {
            let o = options
            self.regex = try Regex(pattern)
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
        } catch {
            throw JSException(message: "\(error)")
        }
    }

    @JS func matches(of input: String) -> [RegexMatch] {
        let r = regex

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

        return matches
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
