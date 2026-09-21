import { ForgotPasswordForm } from '../../../_components/auth-forms';

export default function Page() {
  return (
    <section className="max-w-sm">
      <h1 className="text-2xl font-bold">Slaptažodžio atkūrimas</h1>
      <ForgotPasswordForm locale="lt" />
    </section>
  );
}
