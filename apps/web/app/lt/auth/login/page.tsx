import { LoginForm } from '../../../_components/auth-forms';

export default function Page() {
  return (
    <section className="max-w-sm">
      <h1 className="text-2xl font-bold">Prisijungti</h1>
      <LoginForm locale="lt" />
    </section>
  );
}
