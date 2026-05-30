import Testing
@testable import SwiftRegexTester

@Test func createRegexValid() throws {
    let result = createRegex(pattern: "\\d+")
    guard case .success(let regex) = result else {
        Issue.record("Expected .success, got \(result)"); return
    }
    #expect(regex._regex != nil)
}

@Test func createRegexInvalid() throws {
    let result = createRegex(pattern: "[invalid")
    guard case .failure(let msg) = result else {
        Issue.record("Expected .failure, got \(result)"); return
    }
    #expect(!msg.isEmpty)
}

@Test func testRegexMatches() throws {
    guard case .success(let regex) = createRegex(pattern: "\\d+") else {
        Issue.record("Pattern did not compile"); return
    }
    guard case .success(let matches) = testRegex(regex: regex, input: "abc 123 def 456") else {
        Issue.record("Expected .success from testRegex"); return
    }
    #expect(matches.count == 2)
    #expect(matches[0].value == "123")
    #expect(matches[1].value == "456")
}

@Test func testRegexNoMatch() throws {
    guard case .success(let regex) = createRegex(pattern: "\\d+") else {
        Issue.record("Pattern did not compile"); return
    }
    guard case .success(let matches) = testRegex(regex: regex, input: "no digits here") else {
        Issue.record("Expected .success from testRegex"); return
    }
    #expect(matches.isEmpty)
}

@Test func testRegexCaptureGroups() throws {
    guard case .success(let regex) = createRegex(pattern: "(\\w+)@(\\w+)") else {
        Issue.record("Pattern did not compile"); return
    }
    guard case .success(let matches) = testRegex(regex: regex, input: "user@host") else {
        Issue.record("Expected .success from testRegex"); return
    }
    #expect(matches.count == 1)
    #expect(matches[0].groups.count == 2)
    #expect(matches[0].groups[0].value == "user")
    #expect(matches[0].groups[1].value == "host")
}

@Test func testRegexUncompiledReturnsFailure() {
    let uncompiled = SwiftRegex()
    guard case .failure(let msg) = testRegex(regex: uncompiled, input: "anything") else {
        Issue.record("Expected .failure from testRegex with uncompiled regex"); return
    }
    #expect(!msg.isEmpty)
}

