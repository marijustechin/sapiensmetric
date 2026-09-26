/**
 * Coalesces concurrent invocations of an async operation into a single
 * in-flight promise (T-007). Used for the auth bootstrap so a
 * double-invoked mount effect cannot fire two concurrent refresh calls that
 * race on the rotating refresh cookie and produce a spurious 401.
 *
 * Pure and dependency-free so it can be unit-tested with the built-in Node
 * test runner.
 */
export function createSingleFlight<T>(): (run: () => Promise<T>) => Promise<T> {
  let inFlight: Promise<T> | null = null;

  return (run: () => Promise<T>): Promise<T> => {
    if (inFlight) {
      return inFlight;
    }
    const promise = run();
    inFlight = promise;
    const clear = () => {
      if (inFlight === promise) {
        inFlight = null;
      }
    };
    promise.then(clear, clear);
    return promise;
  };
}
