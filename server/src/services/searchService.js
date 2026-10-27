import { Product } from "../models/Product.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toNonNegativeNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export const buildSearchQuery = ({ q, category, minPrice, maxPrice } = {}) => {
  const query = {};
  const term = typeof q === "string" ? q.trim().slice(0, 100) : "";

  if (term) {
    const regex = { $regex: escapeRegex(term), $options: "i" };
    query.$or = [{ title: regex }, { description: regex }, { tags: { $elemMatch: regex } }];
  }
  if (category) query.category = category;

  const min = toNonNegativeNumber(minPrice);
  const max = toNonNegativeNumber(maxPrice);
  if (min !== null || max !== null) {
    query.price = {};
    if (min !== null) query.price.$gte = min;
    if (max !== null) query.price.$lte = max;
  }

  return query;
};

export const searchProducts = async ({ query, page = 1, limit = 12 }) => {
  const parsedPage = Number.parseInt(page, 10);
  const parsedLimit = Number.parseInt(limit, 10);
  const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const safeLimit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 12;

  const skip = (safePage - 1) * safeLimit;
  const [items, total] = await Promise.all([
    Product.find(query)
      .sort({ popularityScore: -1, totalSold: -1, createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Product.countDocuments(query)
  ]);

  return { items, total, page: safePage, limit: safeLimit };
};
