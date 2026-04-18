import { BarChart, Bar, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const RevenueChart = ({ data }) => (
  <div className="card-glass rounded-2xl p-4">
    <h3 className="mb-3 font-display text-lg font-bold">Revenue Trend</h3>
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="4 4" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const TopProductsChart = ({ data }) => (
  <div className="card-glass rounded-2xl p-4">
    <h3 className="mb-3 font-display text-lg font-bold">Top Products</h3>
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="title" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="totalSold" fill="#f97316" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
