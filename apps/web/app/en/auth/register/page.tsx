import { RegisterForm } from '../../../_components/auth-forms';

export default function Page() {
  return (
    <section className="max-w-sm">
      <h1 className="text-2xl font-bold">Register</h1>
      <RegisterForm locale="en" />
    </section>
  );
}
