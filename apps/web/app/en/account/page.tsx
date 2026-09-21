import { AccountView } from '../../_components/account-view';

export default function Page() {
  return (
    <section className="max-w-sm">
      <h1 className="text-2xl font-bold">Account</h1>
      <AccountView locale="en" />
    </section>
  );
}
