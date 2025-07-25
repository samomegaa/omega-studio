import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Set the token in headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        // Verify token is valid by getting user info
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        // Token is invalid, clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
      }
    }
    setLoading(false);
  };

  // Updated login function to work with the new pattern

const login = (token, userData) => {
  console.log('AuthContext login called with:', { token, userData });
  
  // Save token to localStorage
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));
  
  console.log('Verification - localStorage after setting:');
  console.log('Token exists:', !!localStorage.getItem('token'));
  console.log('User exists:', !!localStorage.getItem('user'));
  
  // Set default authorization header
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  // Update user state
  setUser(userData);
};


  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Remove authorization header
      delete api.defaults.headers.common['Authorization'];
      
      // Clear user state
      setUser(null);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
