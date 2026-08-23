import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existingToken = localStorage.getItem('token');
    if (existingToken) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          setToken(existingToken);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token: t, user: u } = res.data;
        localStorage.setItem('token', t);
        setToken(t);
        setUser(u);
        return { success: true, user: u };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Invalid credentials'
      };
    }
  };

  const switchAccount = async (target) => {
    setLoading(true);
    let credentials;
    if (target === 'staff2' || target === 'outlet2') {
      credentials = { email: 'staff2@retail.com', password: 'Staff@12345' };
    } else if (target === 'staff' || target === 'staff1' || target === 'outlet1') {
      credentials = { email: 'staff1@retail.com', password: 'Staff@12345' };
    } else {
      credentials = { email: 'owner@retail.com', password: 'Owner@12345' };
    }

    const res = await login(credentials.email, credentials.password);
    setLoading(false);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const isOwner = user?.role === 'owner';
  const isStaff = user?.role === 'staff';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        switchAccount,
        isOwner,
        isStaff,
        isAuthenticated: !!token && !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
