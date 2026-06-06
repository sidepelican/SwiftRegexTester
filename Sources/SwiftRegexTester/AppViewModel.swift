import JavaScriptKit
import JavaScriptEventLoop

@JS struct AppViewModel_UIState {
    var patternError: String?
    var result: RegexResult?
}

@JS struct AppViewModel_UIStateBeforeInit {
    var pattern: String
    var options: RegexOptions
    var input: String
}

@JS final class AppViewModel {
    @JS init(state: AppViewModel_UIStateBeforeInit, onUpdate: @escaping () -> Void) {
        self._uiState = AppViewModel_UIState(
            patternError: nil,
            result: nil
        )
        self.onUpdate = onUpdate
        updateResult(regex: updateRegex(pattern: state.pattern, options: state.options), input: state.input)
    }
    @JS var uiState: AppViewModel_UIState {
        _uiState
    }
    private var _uiState: AppViewModel_UIState
    private let onUpdate: () -> Void
    private var regexCache: SwiftRegex?
    private var currentExecutor: WebWorkerDedicatedExecutor?

    @JS func updateRegex(pattern: String, options: RegexOptions, input: String) {
        let regex = updateRegex(pattern: pattern, options: options)
        updateResult(regex: regex, input: input)
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
        currentExecutor?.terminate()
        guard let regex else {
            self._uiState.result = nil
            return
        }

        nonisolated(unsafe) let unsafeSelf = self
        Task {
            let executor: WebWorkerDedicatedExecutor
            do {
                executor = try await WebWorkerDedicatedExecutor()
            } catch {
                print("Failed to create WebWorkerDedicatedExecutor: \(error)")
                return
            }

            unsafeSelf.currentExecutor = executor
            Task(executorPreference: executor) {
                unsafeSelf._uiState.result = regex.result(of: input)
                unsafeSelf.currentExecutor = nil
                Task { @MainActor in
                    unsafeSelf.onUpdate()
                    executor.terminate()
                }
            }
        }
    }
}
