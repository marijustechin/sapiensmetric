export const MAIL_TRANSPORT = Symbol('MAIL_TRANSPORT');

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Provider-agnostic mail transport boundary. No provider-specific SDK or
 * vendor-specific application code may leak above this interface.
 */
export interface MailTransport {
  send(message: MailMessage): Promise<void>;
}
