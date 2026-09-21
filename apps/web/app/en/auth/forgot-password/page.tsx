import { ForgotPasswordForm } from '../../../_components/auth-forms';

export default function Page() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Forgot password</h1>
      <ForgotPasswordForm locale="en" />
    </main>
  );
}
