import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const authVersion = useRef(0);

  const refreshUser = useCallback(async () => {
    const requestVersion = authVersion.current;
    setRefreshing(true);
    try {
      const { data } = await api.get('/auth/me');
      if (requestVersion === authVersion.current) {
        setUser(data.data.user);
      }
    } catch {
      if (requestVersion === authVersion.current) {
        setUser(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshUser();
    };

    window.addEventListener('focus', refreshUser);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.removeEventListener('focus', refreshUser);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [refreshUser]);

  const login = async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    authVersion.current += 1;
    setUser(data.data.user);
    setLoading(false);
    return data.data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    authVersion.current += 1;
    setUser(data.data.user);
    setLoading(false);
    return data.data.user;
  };

  const socialLogin = async (payload) => {
    const { data } = await api.post('/auth/social', payload);
    authVersion.current += 1;
    setUser(data.data.user);
    setLoading(false);
    return data.data.user;
  };

  const logout = async () => {
    authVersion.current += 1;
    await api.post('/auth/logout');
    setUser(null);
    setLoading(false);
  };

  const updateProfile = async (payload) => {
    const { data } = await api.patch('/auth/me', payload);
    authVersion.current += 1;
    setUser(data.data.user);
    setLoading(false);
    return data.data.user;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshing,
      isAdmin: ['admin', 'super_admin'].includes(user?.role),
      isSuperAdmin: user?.role === 'super_admin',
      login,
      register,
      socialLogin,
      logout,
      refreshUser,
      updateProfile
    }),
    [user, loading, refreshing, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
