import { Module } from '@nestjs/common';
import { APP_CONFIG, AppConfig } from '../../config/env.js';
import { MAIL_TRANSPORT } from './transport.js';
import { MAILER_SERVICE, SmtpMailer } from './mailer.service.js';
import { createNodemailerTransport } from './nodemailer-transport.js';

@Module({
  providers: [
    {
      provide: MAIL_TRANSPORT,
      useFactory: (config: AppConfig) => createNodemailerTransport(config.mail),
      inject: [APP_CONFIG],
    },
    { provide: MAILER_SERVICE, useClass: SmtpMailer },
  ],
  exports: [MAILER_SERVICE],
})
export class MailerModule {}
