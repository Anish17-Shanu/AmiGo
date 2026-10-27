import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiErrorMessage } from "../../api/client";
import Container from "../../components/layout/Container";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { currency } from "../../utils/format";

const CartPage = () => {
  const { cart, loading, subtotal, updateItem, removeItem, checkout } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [busyProductId, setBusyProductId] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const changeQuantity = async (item, nextQuantity) => {
    setBusyProductId(item.product._id);
    try {
      await updateItem(item.product._id, nextQuantity);
    } catch (requestError) {
      toast(apiErrorMessage(requestError, "Could not update quantity"), "error");
    } finally {
      setBusyProductId(null);
    }
  };

  const handleRemove = async (item) => {
    setBusyProductId(item.product._id);
    try {
      await removeItem(item.product._id);
      toast("Removed from cart", "success");
    } catch (requestError) {
      toast(apiErrorMessage(requestError, "Could not remove item"), "error");
    } finally {
      setBusyProductId(null);
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const order = await checkout();
      toast(`Order #${order._id.slice(-6)} placed successfully`, "success");
      navigate("/orders");
    } catch (requestError) {
      toast(apiErrorMessage(requestError, "Checkout failed"), "error");
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading && !cart.items.length) return <PageLoader label="Loading cart..." />;

  if (!cart.items.length) {
    return (
      <Container>
        <EmptyState
          title="Your cart is empty"
          description="Browse the store and add a few products to get started."
          action={
            <Link to="/" className="btn-primary">
              Browse products
            </Link>
          }
        />
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="mb-4 font-display text-3xl font-bold">Your Cart</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {cart.items.map((item) => {
            const busy = busyProductId === item.product._id;
            return (
              <div
                key={item.product._id}
                className="card-glass flex flex-wrap items-center gap-4 rounded-2xl p-4"
              >
                <img
                  src={item.product.imageUrl}
                  alt={item.product.title}
                  className="h-20 w-20 rounded-xl object-cover"
                />
                <div className="min-w-[10rem] flex-1">
                  <Link
                    to={`/products/${item.product._id}`}
                    className="font-semibold text-ink hover:text-tide"
                  >
                    {item.product.title}
                  </Link>
                  <p className="text-sm text-slate-500">{currency(item.product.price)} each</p>
                  <p className="text-xs text-slate-500">Stock: {item.product.inventory}</p>
                </div>

                <div className="flex items-center rounded-xl border border-slate-300">
                  <button
                    type="button"
                    onClick={() => changeQuantity(item, item.quantity - 1)}
                    disabled={busy || item.quantity <= 1}
                    className="px-3 py-1.5 text-lg font-bold text-slate-600 disabled:opacity-40"
                    aria-label={`Decrease quantity of ${item.product.title}`}
                  >
                    -
                  </button>
                  <span className="w-10 border-x border-slate-200 py-1.5 text-center text-sm font-bold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(item, item.quantity + 1)}
                    disabled={busy || item.quantity >= item.product.inventory}
                    className="px-3 py-1.5 text-lg font-bold text-slate-600 disabled:opacity-40"
                    aria-label={`Increase quantity of ${item.product.title}`}
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <p className="font-bold text-ink">
                    {currency(item.product.price * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    disabled={busy}
                    className="mt-1 text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="card-glass h-fit rounded-2xl p-5">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <span>Items</span>
            <span>{cart.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-lg font-extrabold text-ink">
            <span>Total</span>
            <span>{currency(subtotal)}</span>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkingOut}
            className="btn-primary mt-5 w-full"
          >
            {checkingOut ? "Placing order..." : "Place order"}
          </button>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Checkout is simulated for this demo. No payment is charged.
          </p>
        </aside>
      </div>
    </Container>
  );
};

export default CartPage;
