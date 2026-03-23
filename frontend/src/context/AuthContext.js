import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('quickserve_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData) => {
    localStorage.setItem('quickserve_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('quickserve_user');
    setUser(null);
  };

  const isAdmin         = user?.role === 'restaurant_admin';
  const isDelivery      = user?.role === 'delivery_partner';
  const isCustomer      = user?.role === 'customer' || user?.role === 'user';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isDelivery, isCustomer }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
