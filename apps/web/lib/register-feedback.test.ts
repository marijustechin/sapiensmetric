import test from 'node:test';
import assert from 'node:assert/strict';
import { registerFeedback, type RegisterFeedbackKind } from './register-feedback.ts';
import type { Locale } from './auth-types.ts';

const LOCALES: Locale[] = ['lt', 'en'];
const KINDS: RegisterFeedbackKind[] = [
  'success',
  'already-registered',
  'delivery-failed',
  'invalid-input',
  'error',
];

test('every locale/kind pair produces a non-empty message', () => {
  for (const locale of LOCALES) {
    for (const kind of KINDS) {
      const feedback = registerFeedback(locale, kind);
      assert.equal(typeof feedback.message, 'string');
      assert.ok(feedback.message.length > 0, `${locale}/${kind} message empty`);
    }
  }
});

test('success offers a sign-in link only', () => {
  for (const locale of LOCALES) {
    const feedback = registerFeedback(locale, 'success');
    assert.equal(feedback.showLogin, true);
    assert.equal(feedback.showResend, false);
    assert.equal(feedback.showForgot, false);
  }
});

test('already-registered offers login, resend, and forgot links', () => {
  for (const locale of LOCALES) {
    const feedback = registerFeedback(locale, 'already-registered');
    assert.equal(feedback.showLogin, true);
    assert.equal(feedback.showResend, true);
    assert.equal(feedback.showForgot, true);
  }
});

test('delivery-failed offers a resend link only', () => {
  for (const locale of LOCALES) {
    const feedback = registerFeedback(locale, 'delivery-failed');
    assert.equal(feedback.showLogin, false);
    assert.equal(feedback.showResend, true);
    assert.equal(feedback.showForgot, false);
  }
});

test('invalid-input and error offer no navigation links', () => {
  for (const locale of LOCALES) {
    for (const kind of ['invalid-input', 'error'] as const) {
      const feedback = registerFeedback(locale, kind);
      assert.equal(feedback.showLogin, false);
      assert.equal(feedback.showResend, false);
      assert.equal(feedback.showForgot, false);
    }
  }
});
