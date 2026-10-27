import { useCallback, useEffect, useState } from "react";
import api, { apiErrorMessage } from "../../api/client";
import Container from "../../components/layout/Container";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { ForecastChart, RevenueChart, TopProductsChart } from "../../components/analytics/Charts";
import InsightsPanel from "../../components/admin/InsightsPanel";
import LiveFeed from "../../components/admin/LiveFeed";
import OrderManager from "../../components/admin/OrderManager";
import ProductManager from "../../components/admin/ProductManager";
import StatsGrid from "../../components/admin/StatsGrid";
import UserManager from "../../components/admin/UserManager";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError("");

      try {
        const [dashboardResponse, ordersResponse, usersResponse, productsResponse] =
          await Promise.all([
            api.get("/admin/dashboard"),
            api.get("/orders"),
            api.get("/admin/users"),
            api.get("/products", { params: { limit: 100 } })
          ]);

        setDashboard(dashboardResponse.data);
        setOrders(ordersResponse.data.orders || []);
        setUsers(usersResponse.data.users || []);
        setProducts(productsResponse.data.items || []);
      } catch (requestError) {
        const message = apiErrorMessage(requestError, "Unable to load admin data");
        if (silent) toast(message, "error");
        else setError(message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader label="Loading admin dashboard..." />;

  if (error || !dashboard) {
    return (
      <Container>
        <EmptyState
          title="Admin data unavailable"
          description={error || "Try again in a moment."}
          action={
            <button type="button" className="btn-primary" onClick={() => load()}>
              Retry
            </button>
          }
        />
      </Container>
    );
  }

  const forecast = dashboard.forecast?.forecast || [];
  const refresh = () => load({ silent: true });

  return (
    <Container>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Admin analytics</h1>
          <p className="text-sm text-slate-500">
            Live commerce metrics, catalog operations, and machine-learning insights.
          </p>
        </div>
        <button type="button" onClick={refresh} className="btn-secondary">
          Refresh data
        </button>
      </div>

      <StatsGrid stats={dashboard.stats} />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {forecast.length ? (
          <ForecastChart data={forecast} />
        ) : (
          <div className="card-glass rounded-2xl p-4">
            <h3 className="font-display text-lg font-bold">7-Day Forecast</h3>
            <p className="mt-2 text-sm text-slate-500">
              Forecast data will appear once orders exist and the analytics service is available.
            </p>
          </div>
        )}
        <RevenueChart data={dashboard.salesTrend} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <TopProductsChart data={dashboard.topProducts} />
        <InsightsPanel products={products} />
      </div>

      <div className="mt-6">
        <ProductManager products={products} onChanged={refresh} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <OrderManager orders={orders} onChanged={refresh} />
        <UserManager users={users} currentUserId={user?.id} onChanged={refresh} />
      </div>

      <div className="mt-6">
        <LiveFeed />
      </div>
    </Container>
  );
};

export default AdminDashboardPage;
