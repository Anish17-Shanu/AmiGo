import { useEffect, useState } from "react";
import api from "../../api/client";
import Container from "../../components/layout/Container";
import { currency, shortDate } from "../../utils/format";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/orders/my").then(({ data }) => setOrders(data.orders || []));
  }, []);

  return (
    <Container>
      <h1 className="mb-4 font-display text-3xl font-bold">Order History</h1>
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order._id} className="card-glass rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="font-bold">Order #{order._id.slice(-6)}</p>
              <p className="text-sm text-slate-600">{shortDate(order.createdAt)}</p>
            </div>
            <p className="text-sm text-slate-600">Status: {order.status}</p>
            <p className="text-base font-bold">{currency(order.totalAmount)}</p>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default OrdersPage;
