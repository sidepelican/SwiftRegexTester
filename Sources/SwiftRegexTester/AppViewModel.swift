import JavaScriptKit
import JavaScriptEventLoop
import Synchronization

@JS struct AppViewModel_UIState {
    var patternError: String? = nil
    var result: RegexResult? = nil
}

@JS final class AppViewModel {
    @JS init(onUpdate: @escaping () -> Void) {
        self.sharedState = Mutex(SharedState(
            uiState: AppViewModel_UIState()
        ))
        self.onUpdate = onUpdate
    }

    @JS var uiState: AppViewModel_UIState {
        sharedState.withLock { $0.uiState }
    }
    private let onUpdate: () -> Void
    private var regexCache: SwiftRegex?
    private var currentExecutor: WebWorkerDedicatedExecutor?
    
    private struct SharedState {
        var uiState: AppViewModel_UIState
    }
    private let sharedState: Mutex<SharedState>

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
            self.sharedState.withLock {
                $0.uiState.patternError = nil
            }
            return regex
        } catch {
            self.regexCache = nil
            self.sharedState.withLock {
                $0.uiState.patternError = "\(error)"
            }
            return nil
        }
    }

    private func updateResult(regex: SwiftRegex?, input: String) {
        currentExecutor?.terminate()
        guard let regex else {
            self.sharedState.withLock {
                $0.uiState.result = nil
            }
            return
        }

        nonisolated(unsafe) let unsafeSelf = self
        Task {
            let executor: WebWorkerDedicatedExecutor
            do {
                executor = try await WebWorkerDedicatedExecutor()
            } catch {
                print("Failed to create executor: \(error)")
                return
            }

            unsafeSelf.currentExecutor = executor
            Task(executorPreference: executor) {
                unsafeSelf.sharedState.withLock {
                    $0.uiState.result = regex.result(of: input)
                }
                unsafeSelf.currentExecutor = nil
                Task { @MainActor in
                    unsafeSelf.onUpdate()
                    executor.terminate()
                }
            }
        }
    }
}
