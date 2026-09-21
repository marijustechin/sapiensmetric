import nodemailer, { type Transporter } from 'nodemailer';
import type { AppConfig } from '../../config/env.js';
import type { MailMessage, MailTransport } from './transport.js';

export interface SmtpTransportOptions {
  host: string;
  port: number;
  secure: boolean;
  requireTLS: boolean;
  ignoreTLS?: boolean;
  auth: { user: string; pass: string };
  tls: { minVersion: 'TLSv1.2' };
}

/**
 * Build SMTP transport options without opening a connection. TLS is never
 * silently downgraded:
 * - SMTP_SECURE=true uses implicit TLS;
 * - SMTP_SECURE=false requires STARTTLS and forbids plaintext fallback
 *   (`requireTLS: true`, `ignoreTLS: false`).
 */
export function buildTransportOptions(
  config: AppConfig['mail'],
): SmtpTransportOptions {
  const base = {
    host: config.host,
    port: config.port,
    auth: { user: config.user, pass: config.password },
    tls: { minVersion: 'TLSv1.2' as const },
  };
  if (config.secure) {
    return { ...base, secure: true, requireTLS: true };
  }
  return { ...base, secure: false, requireTLS: true, ignoreTLS: false };
}

/**
 * Generic SMTP transport using standard authenticated SMTP (nodemailer).
 * TLS/secure mode comes straight from the validated configuration; it is never
 * silently downgraded.
 */
export class NodemailerTransport implements MailTransport {
  private readonly transporter: Transporter;

  constructor(private readonly config: AppConfig['mail']) {
    this.transporter = nodemailer.createTransport(
      buildTransportOptions(config),
    );
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  }
}

export function createNodemailerTransport(
  config: AppConfig['mail'],
): MailTransport {
  return new NodemailerTransport(config);
}
