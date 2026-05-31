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
    case graphemeCluster = "graphemeCluster"
    case unicodeScalar = "unicodeScalar"
}

@JS enum RepetitionBehavior: String {
    case eager = "eager"
    case possessive = "possessive"
    case reluctant = "reluctant"
}

@JS enum WordBoundaryKind: String {
    case simple = "simple"
    case defaultBoundaries = "defaultBoundaries"
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
    init(_ regex: Regex<AnyRegexOutput>) {
        self.regex = regex
    }

    @JS static func tryInit(pattern: String, options: RegexOptions? = nil) -> RegexCompileResult {
        let opts = options ?? RegexOptions(
            anchorsMatchLineEndings: false,
            asciiOnlyCharacterClasses: false,
            asciiOnlyDigits: false,
            asciiOnlyWhitespace: false,
            asciiOnlyWordCharacters: false,
            dotMatchesNewlines: false,
            ignoresCase: false,
            matchingSemantics: .graphemeCluster,
            repetitionBehavior: .eager,
            wordBoundaryKind: .defaultBoundaries
        )
        do {
            var regex = try Regex(pattern)
            if opts.anchorsMatchLineEndings   { regex = regex.anchorsMatchLineEndings() }
            if opts.asciiOnlyCharacterClasses { regex = regex.asciiOnlyCharacterClasses() }
            if opts.asciiOnlyDigits           { regex = regex.asciiOnlyDigits() }
            if opts.asciiOnlyWhitespace       { regex = regex.asciiOnlyWhitespace() }
            if opts.asciiOnlyWordCharacters   { regex = regex.asciiOnlyWordCharacters() }
            if opts.dotMatchesNewlines        { regex = regex.dotMatchesNewlines() }
            if opts.ignoresCase               { regex = regex.ignoresCase() }
            switch opts.matchingSemantics {
            case .graphemeCluster: regex = regex.matchingSemantics(.graphemeCluster)
            case .unicodeScalar:   regex = regex.matchingSemantics(.unicodeScalar)
            }
            switch opts.repetitionBehavior {
            case .eager:      regex = regex.repetitionBehavior(.eager)
            case .possessive: regex = regex.repetitionBehavior(.possessive)
            case .reluctant:  regex = regex.repetitionBehavior(.reluctant)
            }
            switch opts.wordBoundaryKind {
            case .simple:            regex = regex.wordBoundaryKind(.simple)
            case .defaultBoundaries: regex = regex.wordBoundaryKind(.default)
            }
            return .success(SwiftRegex(regex))
        } catch {
            return .failure("\(error)")
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

@JS enum RegexCompileResult {
    case success(SwiftRegex)
    case failure(String)
}

@main
struct SwiftRegexTesterApp {
    static func main() {}
}
