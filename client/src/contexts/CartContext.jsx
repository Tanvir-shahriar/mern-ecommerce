import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { api } from '../services/api.js';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      return null;
    }

    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setCart(data.data.cart);
      return data.data.cart;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (productId, quantity = 1, variant) => {
    const { data } = await api.post('/cart/items', { productId, quantity, variant });
    setCart(data.data.cart);
    return data.data.cart;
  };

  const updateItem = async (itemId, quantity) => {
    const { data } = await api.patch(`/cart/items/${itemId}`, { quantity });
    setCart(data.data.cart);
    return data.data.cart;
  };

  const removeItem = async (itemId) => {
    const { data } = await api.delete(`/cart/items/${itemId}`);
    setCart(data.data.cart);
    return data.data.cart;
  };

  const clearCart = async () => {
    const { data } = await api.delete('/cart');
    setCart(data.data.cart);
  };

  const applyCoupon = async (code) => {
    const { data } = await api.post('/cart/coupon', { code });
    setCart(data.data.cart);
    return data.data.cart;
  };

  const value = useMemo(
    () => ({
      cart,
      loading,
      itemCount: cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      fetchCart,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      applyCoupon,
      setCart
    }),
    [cart, loading, fetchCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
