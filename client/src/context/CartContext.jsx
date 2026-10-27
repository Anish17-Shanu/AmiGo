import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart({ items: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get("/cart");
      setCart(data.cart || { items: [] });
    } catch {
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(async (productId, quantity = 1) => {
    const { data } = await api.post("/cart", { productId, quantity });
    setCart(data.cart);
    return data.cart;
  }, []);

  const updateItem = useCallback(async (productId, quantity) => {
    const { data } = await api.patch(`/cart/${productId}`, { quantity });
    setCart(data.cart);
    return data.cart;
  }, []);

  const removeItem = useCallback(async (productId) => {
    const { data } = await api.delete(`/cart/${productId}`);
    setCart(data.cart);
    return data.cart;
  }, []);

  const checkout = useCallback(async () => {
    const { data } = await api.post("/orders/checkout");
    setCart({ items: [] });
    return data.order;
  }, []);

  const count = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  const subtotal = useMemo(
    () =>
      cart.items.reduce(
        (sum, item) => sum + (item.product?.price || 0) * item.quantity,
        0
      ),
    [cart]
  );

  const value = useMemo(
    () => ({ cart, loading, count, subtotal, refresh, addItem, updateItem, removeItem, checkout }),
    [cart, loading, count, subtotal, refresh, addItem, updateItem, removeItem, checkout]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
