import { useEffect, useMemo, useState } from "react";
import api from "../../api/client";
import Container from "../../components/layout/Container";
import { RevenueChart, TopProductsChart } from "../../components/analytics/Charts";
import { useSocketFeed } from "../../context/SocketContext";
import { currency } from "../../utils/format";

const StatCard = ({ label, value }) => (
  <div className="card-glass rounded-2xl p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 font-display text-3xl font-extrabold text-ink">{value}</p>
  </div>
);

const AdminDashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ title: "", category: "", price: "", inventory: "", description: "" });
  const { liveEvents } = useSocketFeed();

  const load = async () => {
    const [dashRes, orderRes, userRes] = await Promise.all([
      api.get("/admin/dashboard"),
      api.get("/orders"),
      api.get("/admin/users")
    ]);
    setDashboard(dashRes.data);
    setOrders(orderRes.data.orders || []);
    setUsers(userRes.data.users || []);
  };

  useEffect(() => {
    load();
  }, []);

  const createProduct = async (e) => {
    e.preventDefault();
    await api.post("/products", { ...form, price: Number(form.price), inventory: Number(form.inventory) });
    setForm({ title: "", category: "", price: "", inventory: "", description: "" });
    load();
  };

  const updateStatus = async (orderId, status) => {
    await api.patch(`/orders/${orderId}/status`, { status });
    load();
  };

  const forecastSeries = useMemo(() => (dashboard?.salesTrend || []).map((s) => ({ ...s, date: new Date(s.date).toLocaleDateString() })), [dashboard]);

  if (!dashboard) return <Container>Loading admin dashboard...</Container>;

  return (
    <Container>
      <h1 className="mb-5 font-display text-3xl font-extrabold">Admin Analytics Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={currency(dashboard.stats.revenue)} />
        <StatCard label="Orders" value={dashboard.stats.totalOrders} />
        <StatCard label="Active Users" value={dashboard.stats.activeUsers} />
        <StatCard label="Inventory Units" value={dashboard.stats.inventoryUnits} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RevenueChart data={forecastSeries} />
        <TopProductsChart data={dashboard.topProducts} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card-glass rounded-2xl p-4">
          <h2 className="mb-3 font-display text-xl font-bold">Create Product</h2>
          <form onSubmit={createProduct} className="grid gap-2">
            <input placeholder="Title" className="rounded border p-2" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            <input placeholder="Category" className="rounded border p-2" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
            <input placeholder="Price" className="rounded border p-2" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
            <input placeholder="Inventory" className="rounded border p-2" value={form.inventory} onChange={(e) => setForm((p) => ({ ...p, inventory: e.target.value }))} />
            <textarea placeholder="Description" className="rounded border p-2" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            <button className="rounded bg-ink px-4 py-2 font-semibold text-white">Save Product</button>
          </form>
        </section>

        <section className="card-glass rounded-2xl p-4">
          <h2 className="mb-3 font-display text-xl font-bold">Live Event Stream</h2>
          <div className="max-h-72 space-y-2 overflow-auto text-sm">
            {liveEvents.map((event, idx) => (
              <div key={`${event.ts}-${idx}`} className="rounded bg-slate-50 p-2">
                <strong>{event.type}</strong>
                <pre className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{JSON.stringify(event.payload, null, 2)}</pre>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 card-glass rounded-2xl p-4">
        <h2 className="mb-3 font-display text-xl font-bold">Order Management</h2>
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order._id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-slate-50 p-3">
              <span className="font-semibold">{order.user?.name || "User"} - {currency(order.totalAmount)}</span>
              <select value={order.status} onChange={(e) => updateStatus(order._id, e.target.value)} className="rounded border p-1">
                {[
                  "pending",
                  "processing",
                  "shipped",
                  "delivered",
                  "cancelled"
                ].map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 card-glass rounded-2xl p-4">
        <h2 className="mb-3 font-display text-xl font-bold">User Management</h2>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u._id} className="flex items-center justify-between rounded bg-slate-50 p-3">
              <span>{u.name} ({u.email})</span>
              <span className="rounded bg-slate-200 px-2 py-1 text-xs font-semibold uppercase">{u.role}</span>
            </div>
          ))}
        </div>
      </section>
    </Container>
  );
};

export default AdminDashboardPage;
