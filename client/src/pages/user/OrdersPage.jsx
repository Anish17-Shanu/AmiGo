import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { apiErrorMessage } from "../../api/client";
import Container from "../../components/layout/Container";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import StatusBadge from "../../components/StatusBadge";
import { currency, shortDate } from "../../utils/format";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/orders/my");
      setOrders(data.orders || []);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Could not load your orders"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) return <PageLoader label="Loading orders..." />;

  if (error) {
    return (
      <Container>
        <EmptyState
          title="Orders unavailable"
          description={error}
          action={
            <button type="button" className="btn-primary" onClick={loadOrders}>
              Retry
            </button>
          }
        />
      </Container>
    );
  }

  if (!orders.length) {
    return (
      <Container>
        <EmptyState
          title="No orders yet"
          description="Once you check out, your order history will appear here."
          action={
            <Link to="/" className="btn-primary">
              Start shopping
            </Link>
          }
        />
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="mb-4 font-display text-3xl font-bold">Order History</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order._id} className="card-glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-lg font-bold text-ink">
                  Order #{order._id.slice(-6)}
                </p>
                <p className="text-xs text-slate-500">{shortDate(order.createdAt)}</p>
              </div>
              <StatusBadge status={order.status} />
              <p className="text-lg font-extrabold text-ink">{currency(order.totalAmount)}</p>
            </div>

            <ul className="mt-4 divide-y divide-slate-100 rounded-xl bg-slate-50 px-3">
              {order.items.map((item, index) => (
                <li
                  key={`${order._id}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                >
                  <span className="font-semibold text-slate-700">
                    {item.titleSnapshot} <span className="font-normal text-slate-500">x {item.quantity}</span>
                  </span>
                  <span className="text-slate-600">
                    {currency(item.priceSnapshot * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-xs text-slate-500">
              Payment status: {order.paymentStatus === "simulated_paid" ? "simulated paid" : order.paymentStatus}
            </p>
          </article>
        ))}
      </div>
    </Container>
  );
};

export default OrdersPage;
