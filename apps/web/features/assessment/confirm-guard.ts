/**
 * Confirmation guard (T-022 UX follow-up).
 *
 * Pure, testable helper behind in-page confirmations. It guarantees:
 * - cancellation (the confirm resolves false) runs no action and preserves the
 *   caller's state (e.g. unsaved edits);
 * - confirmation runs the action exactly once;
 * - when there is nothing to lose, the action runs without prompting.
 */
export async function confirmThen(
  hasPending: boolean,
  confirmFn: () => Promise<boolean>,
  action: () => void | Promise<void>,
): Promise<boolean> {
  if (hasPending) {
    const confirmed = await confirmFn();
    if (!confirmed) return false;
  }
  await action();
  return true;
}
