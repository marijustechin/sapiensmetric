import { RootLocaleRedirect } from '../../features/locale-preference/root-redirect';

/**
 * Root route `/` (composition only).
 *
 * Delegates to the locale-preference feature, which renders the centred
 * loading state and redirects to the remembered/default locale. See D-022.
 */
export default function RootRedirectPage() {
  return <RootLocaleRedirect />;
}
