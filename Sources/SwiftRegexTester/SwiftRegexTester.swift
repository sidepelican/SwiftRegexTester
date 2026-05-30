import JavaScriptKit

@JS
func hello() -> String {
    message()
}

func message() -> String {
    "Hello from SwiftRegexTester!"
}

@main
struct SwiftRegexTesterApp {
    static func main() {}
}
