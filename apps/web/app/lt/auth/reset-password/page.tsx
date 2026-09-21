import { ResetPasswordForm } from '../../../_components/auth-forms';

export default function Page() {
  return (
    <section className="max-w-sm">
      <h1 className="text-2xl font-bold">Naujas slaptažodis</h1>
      <ResetPasswordForm locale="lt" />
    </section>
  );
}
