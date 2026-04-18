import { StatusCodes } from "http-status-codes";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { catchAsync } from "../utils/catchAsync.js";
import { fetchForecast, fetchSegments, fetchRecommendations } from "../services/analyticsClient.js";

export const getDashboard = catchAsync(async (_req, res) => {
  const [orders, users, products] = await Promise.all([
    Order.find().sort({ createdAt: -1 }),
    User.find().sort({ createdAt: -1 }),
    Product.find().sort({ totalSold: -1 })
  ]);

  const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const activeUsers = users.filter((u) => Date.now() - new Date(u.lastActiveAt).getTime() < 1000 * 60 * 60 * 24).length;
  const topProducts = products.slice(0, 5);

  const salesSeries = orders.map((o) => ({ date: o.createdAt, total: o.totalAmount }));
  const forecast = await fetchForecast({ sales_series: salesSeries });

  res.status(StatusCodes.OK).json({
    success: true,
    stats: {
      revenue,
      totalOrders: orders.length,
      activeUsers,
      inventoryUnits: products.reduce((sum, p) => sum + p.inventory, 0)
    },
    topProducts,
    salesTrend: salesSeries,
    forecast
  });
});

export const getUsers = catchAsync(async (_req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json({ success: true, users });
});

export const updateUserRole = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select("-password");
  res.json({ success: true, user });
});

export const getAdvancedAnalytics = catchAsync(async (_req, res) => {
  const orders = await Order.find();
  const products = await Product.find();

  const interactions = orders.flatMap((order) =>
    order.items.map((item) => ({
      user_id: String(order.user),
      product_id: String(item.product),
      quantity: item.quantity
    }))
  );

  const segmentationData = orders.map((order) => ({
    user_id: String(order.user),
    order_value: order.totalAmount,
    order_count: order.items.length
  }));

  const [recommendations, segments] = await Promise.all([
    fetchRecommendations({ interactions, products }),
    fetchSegments({ customers: segmentationData })
  ]);

  res.json({ success: true, recommendations, segments });
});
