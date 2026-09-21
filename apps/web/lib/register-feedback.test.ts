import test from 'node:test';
import assert from 'node:assert/strict';
import {
  registerFeedback,
  REGISTER_FEEDBACK_KINDS,
} from './register-feedback.ts';

test('every kind yields a non-empty message key and boolean flags', () => {
  for (const kind of REGISTER_FEEDBACK_KINDS) {
    const feedback = registerFeedback(kind);
    assert.equal(typeof feedback.messageKey, 'string');
    assert.ok(feedback.messageKey.length > 0, `${kind} message key empty`);
    assert.equal(typeof feedback.showLogin, 'boolean');
    assert.equal(typeof feedback.showResend, 'boolean');
    assert.equal(typeof feedback.showForgot, 'boolean');
  }
});

test('success offers a sign-in link only', () => {
  const feedback = registerFeedback('success');
  assert.equal(feedback.messageKey, 'success');
  assert.equal(feedback.showLogin, true);
  assert.equal(feedback.showResend, false);
  assert.equal(feedback.showForgot, false);
});

test('already-registered offers login, resend, and forgot links', () => {
  const feedback = registerFeedback('already-registered');
  assert.equal(feedback.messageKey, 'alreadyRegistered');
  assert.equal(feedback.showLogin, true);
  assert.equal(feedback.showResend, true);
  assert.equal(feedback.showForgot, true);
});

test('delivery-failed offers a resend link only', () => {
  const feedback = registerFeedback('delivery-failed');
  assert.equal(feedback.messageKey, 'deliveryFailed');
  assert.equal(feedback.showLogin, false);
  assert.equal(feedback.showResend, true);
  assert.equal(feedback.showForgot, false);
});

test('invalid-input and error offer no navigation links', () => {
  for (const kind of ['invalid-input', 'error'] as const) {
    const feedback = registerFeedback(kind);
    assert.equal(feedback.showLogin, false);
    assert.equal(feedback.showResend, false);
    assert.equal(feedback.showForgot, false);
  }
});
