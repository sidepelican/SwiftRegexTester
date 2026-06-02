import Testing
import JavaScriptKit
@testable import SwiftRegexTester

private func defaultOptions(
    ignoresCase: Bool = false,
    matchingSemantics: MatchingSemantics = .graphemeCluster
) -> RegexOptions {
    RegexOptions(
        anchorsMatchLineEndings: false,
        asciiOnlyCharacterClasses: false,
        asciiOnlyDigits: false,
        asciiOnlyWhitespace: false,
        asciiOnlyWordCharacters: false,
        dotMatchesNewlines: false,
        ignoresCase: ignoresCase,
        matchingSemantics: matchingSemantics,
        repetitionBehavior: .eager,
        wordBoundaryKind: .defaultBoundaries
    )
}

@Test func makeValidRegex() throws {
    let regex = try SwiftRegex(pattern: "\\d+", options: defaultOptions())
    let matches = regex.matches(of: "abc 123")
    #expect(matches.count == 1)
    #expect(matches[0].value == "123")
}

@Test func makeInvalidRegex() {
    #expect(throws: (any Error).self) {
        _ = try SwiftRegex.make(pattern: "[invalid", options: defaultOptions())
    }
}

@Test func regexMatches() throws {
    let regex = try SwiftRegex(pattern: "\\d+", options: defaultOptions())
    let matches = regex.matches(of: "abc 123 def 456")

    #expect(matches.count == 2)
    #expect(matches[0].value == "123")
    #expect(matches[0].start == 4)
    #expect(matches[0].end == 7)
    #expect(matches[1].value == "456")
    #expect(matches[1].start == 12)
    #expect(matches[1].end == 15)
}

@Test func regexNoMatch() throws {
    let regex = try SwiftRegex(pattern: "\\d+", options: defaultOptions())
    let matches = regex.matches(of: "no digits here")
    #expect(matches.isEmpty)
}

@Test func regexCaptureGroups() throws {
    let regex = try SwiftRegex(pattern: "(\\w+)@(?<domain>\\w+)", options: defaultOptions())
    let matches = regex.matches(of: "user@host")

    #expect(matches.count == 1)
    #expect(matches[0].groups.count == 2)
    #expect(matches[0].groups[0].name == "1")
    #expect(matches[0].groups[0].value == "user")
    #expect(matches[0].groups[0].start == 0)
    #expect(matches[0].groups[0].end == 4)
    #expect(matches[0].groups[1].name == "domain")
    #expect(matches[0].groups[1].value == "host")
    #expect(matches[0].groups[1].start == 5)
    #expect(matches[0].groups[1].end == 9)
}

@Test func regexIgnoresCaseOption() throws {
    let regex = try SwiftRegex(pattern: "abc", options: defaultOptions(ignoresCase: true))
    let matches = regex.matches(of: "AbC")

    #expect(matches.count == 1)
    #expect(matches[0].value == "AbC")
}
