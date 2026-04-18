import { StatusCodes } from "http-status-codes";
import { Wishlist } from "../models/Wishlist.js";
import { Product } from "../models/Product.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";

export const getWishlist = catchAsync(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate("products");
  res.json({ success: true, wishlist: wishlist || { user: req.user._id, products: [] } });
});

export const addToWishlist = catchAsync(async (req, res) => {
  const { productId } = req.body;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");

  const wishlist =
    (await Wishlist.findOne({ user: req.user._id })) ||
    (await Wishlist.create({ user: req.user._id, products: [] }));

  if (!wishlist.products.some((p) => p.toString() === productId)) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  res.status(StatusCodes.CREATED).json({ success: true, wishlist });
});

export const removeFromWishlist = catchAsync(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) throw new ApiError(StatusCodes.NOT_FOUND, "Wishlist not found");

  wishlist.products = wishlist.products.filter((p) => p.toString() !== req.params.productId);
  await wishlist.save();

  res.json({ success: true, wishlist });
});
