import { PackageSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmptyState = ({ title, message, actionLabel, actionTo }) => (
  <section className="empty-state">
    <PackageSearch size={34} />
    <h2>{title}</h2>
    {message ? <p>{message}</p> : null}
    {actionLabel && actionTo ? (
      <Link className="button primary" to={actionTo}>
        {actionLabel}
      </Link>
    ) : null}
  </section>
);
