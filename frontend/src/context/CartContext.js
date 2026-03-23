import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], restaurant: null });
  const [loading, setLoading] = useState(false);

  // Fetch cart from server when user logs in
  useEffect(() => {
    if (user) fetchCart();
    else setCart({ items: [], restaurant: null });
  }, [user]);

  const fetchCart = async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch {
      setCart({ items: [], restaurant: null });
    }
  };

  const addToCart = async (menuItemId, quantity = 1) => {
    setLoading(true);
    try {
      const { data } = await api.post('/cart/add', { menuItemId, quantity });
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (menuItemId, quantity) => {
    setLoading(true);
    try {
      const { data } = await api.put(`/cart/item/${menuItemId}`, { quantity });
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      setCart({ items: [], restaurant: null });
    } catch {}
  };

  const itemCount = cart.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
  const totalPrice = cart.items?.reduce((sum, i) => sum + i.price * i.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, clearCart, itemCount, totalPrice, loading, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
