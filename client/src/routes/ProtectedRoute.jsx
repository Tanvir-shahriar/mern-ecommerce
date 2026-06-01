import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin, refreshUser } = useAuth();
  const location = useLocation();
  const [adminRefreshChecked, setAdminRefreshChecked] = useState(false);

  useEffect(() => {
    setAdminRefreshChecked(false);
  }, [location.pathname, user?._id, user?.role]);

  useEffect(() => {
    let active = true;

    if (!loading && adminOnly && user && !isAdmin && !adminRefreshChecked) {
      refreshUser().finally(() => {
        if (active) setAdminRefreshChecked(true);
      });
    }

    return () => {
      active = false;
    };
  }, [adminOnly, adminRefreshChecked, isAdmin, loading, refreshUser, user?._id]);

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (adminOnly && !isAdmin && !adminRefreshChecked) return <LoadingScreen />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return children;
};
