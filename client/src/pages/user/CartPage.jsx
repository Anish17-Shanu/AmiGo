import { useEffect, useState } from "react";
import api from "../../api/client";
import Container from "../../components/layout/Container";
import { currency } from "../../utils/format";

const CartPage = () => {
  const [cart, setCart] = useState({ items: [] });

  const loadCart = async () => {
    const { data } = await api.get("/cart");
    setCart(data.cart || { items: [] });
  };

  useEffect(() => {
    loadCart();
  }, []);

  const removeItem = async (productId) => {
    await api.delete(`/cart/${productId}`);
    loadCart();
  };

  const checkout = async () => {
    await api.post("/orders/checkout");
    alert("Checkout successful (simulated)");
    loadCart();
  };

  const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <Container>
      <h1 className="mb-4 font-display text-3xl font-bold">Cart</h1>
      <div className="space-y-3">
        {cart.items.map((item) => (
          <div key={item.product._id} className="card-glass flex items-center justify-between rounded-xl p-4">
            <div>
              <h3 className="font-semibold">{item.product.title}</h3>
              <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold">{currency(item.product.price * item.quantity)}</span>
              <button onClick={() => removeItem(item.product._id)} className="rounded bg-rose-100 px-3 py-1 text-rose-600">Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between rounded-xl bg-white p-4 shadow">
        <p className="text-lg font-bold">Total: {currency(total)}</p>
        <button onClick={checkout} className="rounded bg-ink px-4 py-2 font-semibold text-white">Checkout</button>
      </div>
    </Container>
  );
};

export default CartPage;
