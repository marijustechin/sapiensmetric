import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, AppConfig } from '../../config/env.js';
import type { Locale } from '@sapiensmetric/contracts';
import { MAIL_TRANSPORT, MailTransport } from './transport.js';

export const MAILER_SERVICE = Symbol('MAILER_SERVICE');

export interface Mailer {
  sendVerificationEmail(
    to: string,
    rawToken: string,
    locale: Locale,
  ): Promise<void>;
  sendPasswordResetEmail(
    to: string,
    rawToken: string,
    locale: Locale,
  ): Promise<void>;
}

interface MailCopy {
  subject: string;
  body: string;
}

const MAIL_COPY: Record<Locale, { verify: MailCopy; reset: MailCopy }> = {
  lt: {
    verify: {
      subject: 'Sapiens Metric — patvirtinkite el. pašto adresą',
      body: 'Patvirtinkite savo el. pašto adresą atidarę šią nuorodą:',
    },
    reset: {
      subject: 'Sapiens Metric — slaptažodžio atkūrimas',
      body: 'Atkurkite slaptažodį atidarę šią nuorodą:',
    },
  },
  en: {
    verify: {
      subject: 'Sapiens Metric — verify your email address',
      body: 'Verify your email address by opening this link:',
    },
    reset: {
      subject: 'Sapiens Metric — password reset',
      body: 'Reset your password by opening this link:',
    },
  },
};

@Injectable()
export class SmtpMailer implements Mailer {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(MAIL_TRANSPORT) private readonly transport: MailTransport,
  ) {}

  private link(locale: Locale, path: string, rawToken: string): string {
    const base = this.config.publicAppUrl.replace(/\/+$/, '');
    return `${base}/${locale}/auth/${path}#token=${rawToken}`;
  }

  private async send(
    to: string,
    locale: Locale,
    copy: MailCopy,
    path: string,
    rawToken: string,
  ): Promise<void> {
    await this.transport.send({
      to,
      subject: copy.subject,
      text: `${copy.body}\n\n${this.link(locale, path, rawToken)}`,
    });
  }

  sendVerificationEmail(
    to: string,
    rawToken: string,
    locale: Locale,
  ): Promise<void> {
    return this.send(
      to,
      locale,
      MAIL_COPY[locale].verify,
      'verify-email',
      rawToken,
    );
  }

  sendPasswordResetEmail(
    to: string,
    rawToken: string,
    locale: Locale,
  ): Promise<void> {
    return this.send(
      to,
      locale,
      MAIL_COPY[locale].reset,
      'reset-password',
      rawToken,
    );
  }
}
