import { Product } from "../models/Product.js";

export const buildSearchQuery = ({ q, category, minPrice, maxPrice }) => {
  const query = {};
  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { tags: { $elemMatch: { $regex: q, $options: "i" } } }
    ];
  }
  if (category) query.category = category;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  return query;
};

export const searchProducts = async ({ query, page = 1, limit = 12 }) => {
  const skip = (Number(page) - 1) * Number(limit);
  const items = await Product.find(query)
    .sort({ popularityScore: -1, totalSold: -1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Product.countDocuments(query);
  return { items, total, page: Number(page), limit: Number(limit) };
};
