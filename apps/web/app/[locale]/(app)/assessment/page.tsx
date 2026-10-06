import { AssessmentScreen } from '../../../../widgets/assessment-screen/assessment-screen';
import { noindexMetadata } from '../../../../shared/content/seo';

export const metadata = noindexMetadata('Assessment');

/**
 * Local synthetic-assessment route (T-019). Thin composition only; the widget
 * owns the auth wiring and the feature owns the runner. It is static-export
 * compatible: there is no dynamic attempt-ID path (the active attempt is a
 * client-side selection), so the build needs no runtime data. The route is
 * `noindex` and excluded from the public release.
 */
export default function Page() {
  return (
    <section className="max-w-3xl">
      <AssessmentScreen />
    </section>
  );
}
