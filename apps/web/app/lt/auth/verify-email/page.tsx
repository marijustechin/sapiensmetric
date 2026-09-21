import { VerifyEmailForm } from '../../../_components/auth-forms';

export default function Page() {
  return (
    <section className="max-w-sm">
      <h1 className="text-2xl font-bold">El. pašto patvirtinimas</h1>
      <VerifyEmailForm locale="lt" />
    </section>
  );
}
