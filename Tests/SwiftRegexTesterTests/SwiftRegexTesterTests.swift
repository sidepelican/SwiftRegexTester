import Testing
@testable import SwiftRegexTester

@Test func createRegexValid() {
    let regex = createRegex(pattern: "\\d+")
    #expect(regex.isValid() == true)
    #expect(regex.errorMessage() == "")
}

@Test func createRegexInvalid() {
    let regex = createRegex(pattern: "[invalid")
    #expect(regex.isValid() == false)
    #expect(!regex.errorMessage().isEmpty)
}

@Test func testRegexMatches() {
    let regex = createRegex(pattern: "\\d+")
    let result = testRegex(regex: regex, input: "abc 123 def 456")
    #expect(result.contains("\"123\""))
    #expect(result.contains("\"456\""))
}

@Test func testRegexNoMatch() {
    let regex = createRegex(pattern: "\\d+")
    let result = testRegex(regex: regex, input: "no digits here")
    #expect(result == "{\"matches\":[]}")
}

@Test func testRegexCaptureGroups() {
    let regex = createRegex(pattern: "(\\w+)@(\\w+)")
    let result = testRegex(regex: regex, input: "user@host")
    #expect(result.contains("\"user\""))
    #expect(result.contains("\"host\""))
}

@Test func testRegexInvalidPatternReturnsError() {
    let regex = createRegex(pattern: "[invalid")
    let result = testRegex(regex: regex, input: "anything")
    #expect(result.hasPrefix("{\"error\":"))
}
