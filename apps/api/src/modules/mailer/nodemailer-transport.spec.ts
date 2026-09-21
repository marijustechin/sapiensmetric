import { describe, it, expect } from 'vitest';
import { buildTransportOptions } from './nodemailer-transport.js';
import type { AppConfig } from '../../config/env.js';

function mailConfig(secure: boolean): AppConfig['mail'] {
  return {
    host: 'smtp.example.test',
    port: 587,
    secure,
    user: 'u',
    password: 'p',
    from: 'no-reply@example.test',
    testRecipient: null,
  };
}

describe('SMTP transport options (no network connection)', () => {
  it('uses implicit TLS when SMTP_SECURE=true', () => {
    const options = buildTransportOptions(mailConfig(true));
    expect(options.secure).toBe(true);
    expect(options.requireTLS).toBe(true);
  });

  it('requires STARTTLS and forbids plaintext fallback when SMTP_SECURE=false', () => {
    const options = buildTransportOptions(mailConfig(false));
    expect(options.secure).toBe(false);
    expect(options.requireTLS).toBe(true);
    expect(options.ignoreTLS).toBe(false);
  });

  it('sets a minimum TLS version', () => {
    expect(buildTransportOptions(mailConfig(false)).tls.minVersion).toBe(
      'TLSv1.2',
    );
  });
});
