import { EmptyState } from '../components/EmptyState.jsx';

export const NotFoundPage = () => (
  <EmptyState title="Page not found" message="The page you requested is not available." actionLabel="Go home" actionTo="/" />
);
