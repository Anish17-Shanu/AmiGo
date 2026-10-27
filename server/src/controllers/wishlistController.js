import { StatusCodes } from "http-status-codes";
import { Wishlist } from "../models/Wishlist.js";
import { Product } from "../models/Product.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";

const loadWishlist = async (userId) => {
  const wishlist = await Wishlist.findOne({ user: userId }).populate("products");
  if (!wishlist) return { user: userId, products: [] };

  const products = wishlist.products.filter(Boolean);
  if (products.length !== wishlist.products.length) {
    wishlist.products = products.map((product) => product._id);
    await wishlist.save();
  }

  return wishlist;
};

export const getWishlist = catchAsync(async (req, res) => {
  const wishlist = await loadWishlist(req.user._id);
  res.json({ success: true, wishlist });
});

export const addToWishlist = catchAsync(async (req, res) => {
  const { productId } = req.body;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");

  const wishlist =
    (await Wishlist.findOne({ user: req.user._id })) ||
    (await Wishlist.create({ user: req.user._id, products: [] }));

  if (!wishlist.products.some((entry) => entry.toString() === productId)) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  const populated = await loadWishlist(req.user._id);
  res.status(StatusCodes.CREATED).json({ success: true, wishlist: populated });
});

export const removeFromWishlist = catchAsync(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.products = wishlist.products.filter(
      (entry) => entry.toString() !== req.params.productId
    );
    await wishlist.save();
  }

  const populated = await loadWishlist(req.user._id);
  res.json({ success: true, wishlist: populated });
});
