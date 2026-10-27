import { currency } from "../../utils/format";

const StatCard = ({ label, value }) => (
  <div className="card-glass rounded-2xl p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 font-display text-3xl font-extrabold text-ink">{value}</p>
  </div>
);

const StatsGrid = ({ stats }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatCard label="Revenue" value={currency(stats.revenue)} />
    <StatCard label="Orders" value={stats.totalOrders} />
    <StatCard label="Active users (24h)" value={stats.activeUsers} />
    <StatCard label="Inventory units" value={stats.inventoryUnits} />
  </div>
);

export default StatsGrid;
