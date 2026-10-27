import { StatusCodes } from "http-status-codes";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";
import { fetchForecast, fetchSegments, fetchRecommendations } from "../services/analyticsClient.js";

const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

export const getDashboard = catchAsync(async (_req, res) => {
  const [orders, users, products] = await Promise.all([
    Order.find().sort({ createdAt: 1 }),
    User.find().sort({ createdAt: -1 }),
    Product.find().sort({ totalSold: -1 })
  ]);

  const billableOrders = orders.filter((order) => order.status !== "cancelled");
  const revenue = billableOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const activeCutoff = Date.now() - 24 * 60 * 60 * 1000;
  const activeUsers = users.filter(
    (user) => user.lastActiveAt && new Date(user.lastActiveAt).getTime() >= activeCutoff
  ).length;

  const salesByDay = new Map();
  for (const order of billableOrders) {
    const key = dayKey(order.createdAt);
    salesByDay.set(key, (salesByDay.get(key) || 0) + order.totalAmount);
  }
  const salesTrend = [...salesByDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, total]) => ({ date, total }));

  const forecast = await fetchForecast({ sales_series: salesTrend });

  res.status(StatusCodes.OK).json({
    success: true,
    stats: {
      revenue,
      totalOrders: orders.length,
      activeUsers,
      inventoryUnits: products.reduce((sum, product) => sum + product.inventory, 0)
    },
    topProducts: products.slice(0, 5),
    salesTrend,
    forecast
  });
});

export const getUsers = catchAsync(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, users });
});

export const updateUserRole = catchAsync(async (req, res) => {
  if (String(req.user._id) === req.params.id) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "You cannot change your own role");
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    { new: true, runValidators: true }
  );
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

  res.json({ success: true, user });
});

export const getAdvancedAnalytics = catchAsync(async (_req, res) => {
  const [orders, products] = await Promise.all([Order.find(), Product.find()]);

  const interactions = orders.flatMap((order) =>
    order.items.map((item) => ({
      user_id: String(order.user),
      product_id: String(item.product),
      quantity: item.quantity
    }))
  );

  const customerMap = new Map();
  for (const order of orders) {
    const key = String(order.user);
    const customer = customerMap.get(key) || { user_id: key, order_value: 0, order_count: 0 };
    customer.order_value += order.totalAmount;
    customer.order_count += 1;
    customerMap.set(key, customer);
  }
  const customers = [...customerMap.values()];

  const [recommendations, segments] = await Promise.all([
    fetchRecommendations({ interactions, products }),
    fetchSegments({ customers })
  ]);

  res.json({ success: true, recommendations, segments });
});
