import { StatusCodes } from "http-status-codes";
import { Product } from "../models/Product.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";
import { buildSearchQuery, searchProducts } from "../services/searchService.js";
import { findPeopleAlsoBought } from "../services/recommendationService.js";
import { generateDescription } from "../services/descriptionGenerator.js";

export const listProducts = catchAsync(async (req, res) => {
  const query = buildSearchQuery(req.query);
  const result = await searchProducts({ query, page: req.query.page, limit: req.query.limit });
  res.json({ success: true, ...result });
});

export const getProductById = catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");

  const alsoBoughtIds = await findPeopleAlsoBought(product._id);
  const peopleAlsoBought = await Product.find({ _id: { $in: alsoBoughtIds } });

  res.json({ success: true, product, peopleAlsoBought });
});

export const createProduct = catchAsync(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.description) payload.description = generateDescription(payload);
  const product = await Product.create(payload);
  res.status(StatusCodes.CREATED).json({ success: true, product });
});

export const updateProduct = catchAsync(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  res.json({ success: true, product });
});

export const deleteProduct = catchAsync(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  res.json({ success: true, message: "Product deleted" });
});
