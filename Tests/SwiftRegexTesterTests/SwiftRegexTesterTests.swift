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
    let result = regex.result(of: "abc 123")
    #expect(result.matches.count == 1)
    #expect(result.matches[0].value == "123")
}

@Test func makeInvalidRegex() {
    #expect(throws: (any Error).self) {
        _ = try SwiftRegex.make(pattern: "[invalid", options: defaultOptions())
    }
}

@Test func regexMatches() throws {
    let regex = try SwiftRegex(pattern: "\\d+", options: defaultOptions())
    let result = regex.result(of: "abc 123 def 456")

    #expect(result.matches.count == 2)
    #expect(result.matches[0].value == "123")
    #expect(result.matches[0].start == 4)
    #expect(result.matches[0].end == 7)
    #expect(result.matches[1].value == "456")
    #expect(result.matches[1].start == 12)
    #expect(result.matches[1].end == 15)
}

@Test func regexNoMatch() throws {
    let regex = try SwiftRegex(pattern: "\\d+", options: defaultOptions())
    let result = regex.result(of: "no digits here")
    #expect(result.matches.isEmpty)
}

@Test func regexCaptureGroups() throws {
    let regex = try SwiftRegex(pattern: "(\\w+)@(?<domain>\\w+)", options: defaultOptions())
    let result = regex.result(of: "user@host")

    #expect(result.matches.count == 1)
    #expect(result.matches[0].groups.count == 2)
    #expect(result.matches[0].groups[0].name == "1")
    #expect(result.matches[0].groups[0].value == "user")
    #expect(result.matches[0].groups[0].start == 0)
    #expect(result.matches[0].groups[0].end == 4)
    #expect(result.matches[0].groups[1].name == "domain")
    #expect(result.matches[0].groups[1].value == "host")
    #expect(result.matches[0].groups[1].start == 5)
    #expect(result.matches[0].groups[1].end == 9)
}

@Test func regexIgnoresCaseOption() throws {
    let regex = try SwiftRegex(pattern: "abc", options: defaultOptions(ignoresCase: true))
    let result = regex.result(of: "AbC")

    #expect(result.matches.count == 1)
    #expect(result.matches[0].value == "AbC")
}

@Test func highlightPartsPreserveComplexGraphemeClusters() throws {
    let regex = try SwiftRegex(pattern: "👨‍👩‍👧‍👦", options: defaultOptions())
    let result = regex.result(of: "a👨‍👩‍👧‍👦b")

    #expect(result.highlightParts.count == 3)
    #expect(result.highlightParts[0].text == "a")
    #expect(result.highlightParts[0].marked == false)
    #expect(result.highlightParts[1].text == "👨‍👩‍👧‍👦")
    #expect(result.highlightParts[1].marked == true)
    #expect(result.highlightParts[2].text == "b")
    #expect(result.highlightParts[2].marked == false)
}

@Test func resultContainsMatchesAndHighlightParts() throws {
    let regex = try SwiftRegex(pattern: "\\d+", options: defaultOptions())
    let result = regex.result(of: "abc 123 def 456")

    #expect(result.matches.count == 2)
    #expect(result.matches[0].value == "123")
    #expect(result.matches[1].value == "456")
    #expect(result.highlightParts.count == 4)
    #expect(result.highlightParts[0].text == "abc ")
    #expect(result.highlightParts[0].marked == false)
    #expect(result.highlightParts[1].text == "123")
    #expect(result.highlightParts[1].marked == true)
    #expect(result.highlightParts[2].text == " def ")
    #expect(result.highlightParts[2].marked == false)
    #expect(result.highlightParts[3].text == "456")
    #expect(result.highlightParts[3].marked == true)
}
