import { useMemo, useState } from "react";
import api, { apiErrorMessage } from "../../api/client";
import StatusBadge from "../StatusBadge";
import { useToast } from "../../context/ToastContext";
import { currency, shortDate } from "../../utils/format";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

const OrderManager = ({ orders, onChanged }) => {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  const visibleOrders = useMemo(
    () => (filter === "all" ? orders : orders.filter((order) => order.status === filter)),
    [orders, filter]
  );

  const updateStatus = async (order, status) => {
    if (status === order.status) return;
    setUpdatingId(order._id);
    try {
      await api.patch(`/orders/${order._id}/status`, { status });
      toast(`Order #${order._id.slice(-6)} marked ${status}`, "success");
      onChanged();
    } catch (requestError) {
      toast(apiErrorMessage(requestError, "Could not update order"), "error");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="card-glass rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">Order management</h2>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="input w-auto"
          aria-label="Filter orders by status"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 space-y-3">
        {visibleOrders.map((order) => (
          <div
            key={order._id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
          >
            <div className="min-w-[12rem]">
              <p className="font-semibold text-slate-800">
                #{order._id.slice(-6)} - {order.user?.name || "Deleted user"}
              </p>
              <p className="text-xs text-slate-500">
                {order.user?.email || "n/a"} - {shortDate(order.createdAt)} -{" "}
                {order.items.length} line item(s)
              </p>
            </div>

            <StatusBadge status={order.status} />
            <p className="font-bold text-ink">{currency(order.totalAmount)}</p>

            <select
              value={order.status}
              onChange={(event) => updateStatus(order, event.target.value)}
              disabled={updatingId === order._id || order.status === "cancelled"}
              className="input w-auto min-w-[9rem]"
              aria-label={`Update status for order ${order._id.slice(-6)}`}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        ))}

        {!visibleOrders.length && (
          <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
            No orders match this filter.
          </p>
        )}
      </div>
    </section>
  );
};

export default OrderManager;
