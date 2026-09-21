import { VerifyEmailForm } from '../../../_components/auth-forms';

export default function Page() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Verify your email</h1>
      <VerifyEmailForm locale="en" />
    </main>
  );
}
