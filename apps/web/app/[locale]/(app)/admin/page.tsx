import { AdminShell } from '../../../../widgets/admin-shell/admin-shell';
import { noindexMetadata } from '../../../../shared/content/seo';
export const metadata = noindexMetadata('Admin');

/**
 * Admin route (T-012). Thin composition only; the widget composes the admin
 * feature. The route is static-export compatible (no build-time user records,
 * no arbitrary `[userId]` route): the user detail is a client-side panel.
 */
export default function Page() {
  return (
    <section className="max-w-5xl">
      <AdminShell />
    </section>
  );
}
