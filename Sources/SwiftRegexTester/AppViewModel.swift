import JavaScriptKit

@JS struct AppViewModel_UIState {
    var patternError: String?
    var result: RegexResult?
}

@JS struct AppViewModel_UIStateBeforeInit {
    var pattern: String
    var options: RegexOptions
    var input: String
}

@JS class AppViewModel {

    @JS init(state: AppViewModel_UIStateBeforeInit) {
        self._uiState = AppViewModel_UIState(
            patternError: nil,
            result: nil
        )
        updateResult(regex: updateRegex(pattern: state.pattern, options: state.options), input: state.input)
    }

    @JS var uiState: AppViewModel_UIState {
        _uiState
    }
    private var _uiState: AppViewModel_UIState
    private var regexCache: SwiftRegex?

    @JS func updateRegex(pattern: String, options: RegexOptions, input: String) {
        updateResult(regex: updateRegex(pattern: pattern, options: options), input: input)
    }

    @JS func updateInput(input: String) {
        updateResult(regex: regexCache, input: input)
    }

    private func updateRegex(pattern: String, options: RegexOptions) -> SwiftRegex? {
        do {
            let regex = try SwiftRegex(pattern: pattern, options: options)
            self.regexCache = regex
            self._uiState.patternError = nil
            return regex
        } catch {
            self.regexCache = nil
            self._uiState.patternError = "\(error)"
            return nil
        }
    }

    private func updateResult(regex: SwiftRegex?, input: String) {
        if let regex = regex {
            self._uiState.result = regex.result(of: input)
        } else {
            self._uiState.result = nil
        }
    }
}
