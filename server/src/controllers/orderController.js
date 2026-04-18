import { StatusCodes } from "http-status-codes";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";
import { emitEvent, trackActivity } from "../services/realtimeService.js";
import { SOCKET_EVENTS } from "../utils/socketEvents.js";

export const checkout = catchAsync(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  if (!cart || cart.items.length === 0) throw new ApiError(StatusCodes.BAD_REQUEST, "Cart is empty");

  let totalAmount = 0;
  const items = [];

  for (const item of cart.items) {
    if (item.product.inventory < item.quantity) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Insufficient inventory for ${item.product.title}`);
    }

    item.product.inventory -= item.quantity;
    item.product.totalSold += item.quantity;
    item.product.popularityScore += item.quantity * 2;
    await item.product.save();

    totalAmount += item.product.price * item.quantity;
    items.push({
      product: item.product._id,
      titleSnapshot: item.product.title,
      priceSnapshot: item.product.price,
      quantity: item.quantity
    });
  }

  const order = await Order.create({
    user: req.user._id,
    items,
    totalAmount,
    paymentStatus: "simulated_paid"
  });

  cart.items = [];
  await cart.save();

  emitEvent(SOCKET_EVENTS.ORDER_CREATED, order);
  emitEvent(SOCKET_EVENTS.SALES_UPDATED, { amount: totalAmount, orderId: order._id });
  await trackActivity({ user: req.user._id, type: "checkout", metadata: { orderId: order._id, totalAmount } });

  res.status(StatusCodes.CREATED).json({ success: true, order });
});

export const listMyOrders = catchAsync(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

export const listAllOrders = catchAsync(async (_req, res) => {
  const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

export const updateOrderStatus = catchAsync(async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  if (!order) throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");

  res.json({ success: true, order });
});

export const listTrendingProducts = catchAsync(async (_req, res) => {
  const products = await Product.find().sort({ popularityScore: -1, totalSold: -1 }).limit(10);
  emitEvent(SOCKET_EVENTS.TRENDING_UPDATED, products);
  res.json({ success: true, products });
});
