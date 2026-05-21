export const AdminLoadingState = ({ label = 'Loading admin data' }) => (
  <div className="admin-loading-state" role="status" aria-live="polite">
    <span className="spinner small" />
    <span>{label}</span>
  </div>
);
