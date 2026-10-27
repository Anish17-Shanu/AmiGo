import { StatusCodes } from "http-status-codes";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";
import { emitEvent, emitToAdmins, trackActivity } from "../services/realtimeService.js";
import { SOCKET_EVENTS } from "../utils/socketEvents.js";

const roundCurrency = (value) => Math.round(value * 100) / 100;

export const checkout = catchAsync(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  if (!cart || cart.items.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Cart is empty");
  }

  const applied = [];
  const lineItems = [];
  let totalAmount = 0;
  let order;

  try {
    for (const item of cart.items) {
      if (!item.product) continue;
      const quantity = item.quantity;
      if (!Number.isInteger(quantity) || quantity < 1) continue;

      const updated = await Product.findOneAndUpdate(
        { _id: item.product._id, inventory: { $gte: quantity } },
        { $inc: { inventory: -quantity, totalSold: quantity, popularityScore: quantity * 2 } },
        { new: true }
      );

      if (!updated) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          `Insufficient inventory for ${item.product.title}`
        );
      }

      applied.push({ productId: updated._id, quantity });
      totalAmount += updated.price * quantity;
      lineItems.push({
        product: updated._id,
        titleSnapshot: updated.title,
        priceSnapshot: updated.price,
        quantity
      });
    }

    if (lineItems.length === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Cart has no purchasable items");
    }

    order = await Order.create({
      user: req.user._id,
      items: lineItems,
      totalAmount: roundCurrency(totalAmount),
      paymentStatus: "simulated_paid"
    });
  } catch (error) {
    await Promise.all(
      applied.map(({ productId, quantity }) =>
        Product.updateOne(
          { _id: productId },
          { $inc: { inventory: quantity, totalSold: -quantity, popularityScore: -quantity * 2 } }
        )
      )
    );
    throw error;
  }

  await Cart.updateOne({ _id: cart._id }, { $set: { items: [] } });

  emitToAdmins(SOCKET_EVENTS.ORDER_CREATED, order);
  emitToAdmins(SOCKET_EVENTS.SALES_UPDATED, { amount: totalAmount, orderId: order._id });
  await trackActivity({
    user: req.user._id,
    type: "checkout",
    metadata: { orderId: order._id, totalAmount }
  });

  res.status(StatusCodes.CREATED).json({ success: true, order });
});

export const listMyOrders = catchAsync(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

export const listAllOrders = catchAsync(async (_req, res) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ success: true, orders });
});

export const updateOrderStatus = catchAsync(async (req, res) => {
  const nextStatus = req.body.status;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");

  if (order.status === "cancelled" && nextStatus !== "cancelled") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Cancelled orders cannot be reopened");
  }

  if (nextStatus === "cancelled" && order.status !== "cancelled") {
    await Promise.all(
      order.items.map((item) =>
        Product.updateOne(
          { _id: item.product },
          {
            $inc: {
              inventory: item.quantity,
              totalSold: -item.quantity,
              popularityScore: -item.quantity * 2
            }
          }
        )
      )
    );
  }

  order.status = nextStatus;
  await order.save();

  res.json({ success: true, order });
});

export const listTrendingProducts = catchAsync(async (_req, res) => {
  const products = await Product.find().sort({ popularityScore: -1, totalSold: -1 }).limit(10);
  emitEvent(SOCKET_EVENTS.TRENDING_UPDATED, products);
  res.json({ success: true, products });
});
