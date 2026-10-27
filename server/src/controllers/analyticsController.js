import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { catchAsync } from "../utils/catchAsync.js";
import { fetchRecommendations } from "../services/analyticsClient.js";

export const personalizedRecommendations = catchAsync(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  const products = await Product.find();

  const interactions = orders.flatMap((order) =>
    order.items.map((item) => ({ user_id: String(req.user._id), product_id: String(item.product), quantity: item.quantity }))
  );

  const recommendationPayload = await fetchRecommendations({
    interactions,
    products,
    user_id: String(req.user._id)
  });

  const recommendedIds = (recommendationPayload.recommendations || [])
    .map((entry) => String(entry?.product_id ?? ""))
    .filter((id) => mongoose.isValidObjectId(id));
  if (recommendedIds.length === 0) {
    return res.json({ success: true, recommendations: [] });
  }

  const recommendedProducts = await Product.find({ _id: { $in: recommendedIds } });
  return res.json({ success: true, recommendations: recommendedProducts });
});
