import { EmptyState } from '../components/EmptyState.jsx';
import { Seo } from '../components/Seo.jsx';

export const NotFoundPage = () => (
  <>
    <Seo title="Page Not Found" noIndex />
    <EmptyState title="Page not found" message="The page you requested is not available." actionLabel="Go home" actionTo="/" />
  </>
);
