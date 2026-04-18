import { Order } from "../models/Order.js";

export const findPeopleAlsoBought = async (productId) => {
  const combos = await Order.aggregate([
    { $match: { "items.product": productId } },
    { $unwind: "$items" },
    { $match: { "items.product": { $ne: productId } } },
    { $group: { _id: "$items.product", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 }
  ]);

  return combos.map((entry) => entry._id);
};
