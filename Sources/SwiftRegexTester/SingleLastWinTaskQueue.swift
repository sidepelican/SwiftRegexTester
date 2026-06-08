import JavaScriptEventLoop
import Synchronization

final class SingleLastWinTaskQueue: Sendable {
    private struct SharedState {
        var currentComputeID: Int = 0
        var currentExecutor: WebWorkerDedicatedExecutor? = nil
        var isExecutorBusy: Bool = false
    }

    private let sharedState = Mutex<SharedState>(SharedState())

    init() {}

    func enqueue(task: @escaping @Sendable () -> Void) {
        let (myComputeID, reusableExecutor) = sharedState.withLock { state in
            state.currentComputeID += 1

            let executor: WebWorkerDedicatedExecutor?
            if let currentExecutor = state.currentExecutor {
                if !state.isExecutorBusy {
                    state.isExecutorBusy = true
                    executor = currentExecutor
                } else {
                    currentExecutor.terminate()
                    state.currentExecutor = nil
                    executor = nil
                }
            } else {
                executor = nil
            }

            return (state.currentComputeID, executor)
        }

        if let reusableExecutor {
            self.execute(task, on: reusableExecutor, computeID: myComputeID)
        } else {
            Task.immediate {
                do {
                    let newExecutor = try await WebWorkerDedicatedExecutor()

                    let isLatest = sharedState.withLock { state -> Bool in
                        if state.currentComputeID == myComputeID {
                            state.currentExecutor = newExecutor
                            state.isExecutorBusy = true
                            return true
                        }
                        return false
                    }

                    if isLatest {
                        self.execute(task, on: newExecutor, computeID: myComputeID)
                    } else {
                        // 待っている間にさらに新しいタスクが来期していた場合は破棄
                        newExecutor.terminate()
                    }
                } catch {
                    print("Failed to create executor: \(error)")
                }
            }
        }
    }

    func discardCurrentTask() {
        sharedState.withLock { state in
            state.currentExecutor?.terminate()
            state.currentExecutor = nil
            state.isExecutorBusy = false
        }
    }

    private func execute(
        _ task: @escaping @Sendable () -> Void,
        on executor: WebWorkerDedicatedExecutor,
        computeID: Int
    ) {
        Task(executorPreference: executor) {
            task()

            self.sharedState.withLock { state in
                if state.currentComputeID == computeID {
                    state.isExecutorBusy = false
                }
            }
        }
    }
}
