import { useCallback, useMemo, useState } from 'react';
import { AuthContext } from './authContext';

const getInitialAuth = () => {
  try {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      return { token: storedToken, user: JSON.parse(storedUser) };
    }
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return { token: null, user: null };
};

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getInitialAuth);

  const login = useCallback((newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setAuth({ token: newToken, user: userData });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth({ token: null, user: null });
  }, []);

  const { token, user } = auth;
  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'ADMIN';
  const value = useMemo(
    () => ({ user, token, loading: false, isAuthenticated, isAdmin, login, logout }),
    [isAdmin, isAuthenticated, login, logout, token, user],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
