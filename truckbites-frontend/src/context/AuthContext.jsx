import { createContext, useContext, useState, useCallback } from 'react';
import logger from '../utils/logger';

const COMPONENT = 'AuthContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [role, setRole] = useState(() => localStorage.getItem('role'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken'));

  const login = useCallback((data) => {
    const { user: userData, token: jwt, role: userRole, refreshToken: rt } = data;
    logger.info(COMPONENT, 'User logged in', {
      email: userData?.email,
      role: userRole,
    });
    setUser(userData);
    setToken(jwt);
    setRole(userRole);
    if (rt) setRefreshToken(rt);
    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userRole) localStorage.setItem('role', userRole);
    if (rt) localStorage.setItem('refreshToken', rt);
  }, []);

  const setNewToken = useCallback((newToken, newRefreshToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    if (newRefreshToken) {
      setRefreshToken(newRefreshToken);
      localStorage.setItem('refreshToken', newRefreshToken);
    }
  }, []);

  const logout = useCallback(() => {
    logger.info(COMPONENT, 'User logged out', { email: user?.email });
    setUser(null);
    setToken(null);
    setRole(null);
    setRefreshToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('refreshToken');
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, role, refreshToken, login, logout, setNewToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
