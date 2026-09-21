import { ResetPasswordForm } from '../../../_components/auth-forms';

export default function Page() {
  return (
    <section className="max-w-sm">
      <h1 className="text-2xl font-bold">Reset password</h1>
      <ResetPasswordForm locale="en" />
    </section>
  );
}
