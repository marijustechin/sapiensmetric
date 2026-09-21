import { ForgotPasswordForm } from '../../../_components/auth-forms';

export default function Page() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Slaptažodžio atkūrimas</h1>
      <ForgotPasswordForm locale="lt" />
    </main>
  );
}
