import 'reflect-metadata';
import { loadAppConfig } from './config/env.js';
import { createNodemailerTransport } from './modules/mailer/nodemailer-transport.js';

/**
 * Opt-in live-SMTP smoke command. It fails closed unless SMTP_SMOKE_CONFIRM=send
 * is supplied for this invocation, sends exactly one benign message to the
 * configured controlled test recipient, and never prints a secret, token, URL,
 * password, or recipient value.
 *
 * It is intentionally excluded from pnpm test, pnpm verify, and integration
 * tests.
 */
async function run(): Promise<void> {
  if (process.env.SMTP_SMOKE_CONFIRM !== 'send') {
    console.error(
      'SMTP smoke refused: set SMTP_SMOKE_CONFIRM=send for this invocation.',
    );
    process.exit(1);
  }

  const config = loadAppConfig();
  if (!config.mail.testRecipient) {
    console.error(
      'SMTP smoke refused: no controlled test recipient is configured.',
    );
    process.exit(1);
  }

  const transport = createNodemailerTransport(config.mail);
  try {
    await transport.send({
      to: config.mail.testRecipient,
      subject: 'Sapiens Metric SMTP smoke test',
      text: 'Sapiens Metric SMTP smoke test. This is the only message sent by this command.',
    });
    console.log('SMTP smoke: one message accepted for the controlled recipient.');
  } catch {
    console.error(
      'SMTP smoke: delivery failed (no secret, token, URL, password, or recipient printed).',
    );
    process.exit(1);
  }
}

void run();
