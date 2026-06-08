import JavaScriptKit
import Synchronization

@JS struct AppViewModel_UIState {
    var isComputing: Bool = false
    var patternError: String? = nil
    var result: RegexResult? = nil
}

@JS final class AppViewModel {
    @JS init(onUpdate: @escaping () -> Void) {
        self.sharedState = Mutex(SharedState(
            uiState: AppViewModel_UIState()
        ))
        self.onUpdate = onUpdate
        self.computeQueue = SingleLastWinTaskQueue()
    }

    @JS var uiState: AppViewModel_UIState {
        sharedState.withLock { $0.uiState }
    }
    private let onUpdate: () -> Void
    private let computeQueue: SingleLastWinTaskQueue
    private var regexCache: SwiftRegex?
    
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
        guard let regex else {
            self.sharedState.withLock {
                $0.uiState.result = nil
                $0.uiState.isComputing = false
            }
            computeQueue.discardCurrentTask()
            return
        }

        sharedState.withLock {
            $0.uiState.isComputing = true
        }
        nonisolated(unsafe) weak let unsafeSelf = self
        computeQueue.enqueue {
            let result = regex.result(of: input)
            unsafeSelf?.sharedState.withLock {
                $0.uiState.result = result
                $0.uiState.isComputing = false
            }
            Task { @MainActor in
                unsafeSelf?.onUpdate()
            }
        }
    }
}
