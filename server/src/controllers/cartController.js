import { StatusCodes } from "http-status-codes";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";
import { trackActivity } from "../services/realtimeService.js";

export const getCart = catchAsync(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  res.json({ success: true, cart: cart || { user: req.user._id, items: [] } });
});

export const addToCart = catchAsync(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");

  const cart = (await Cart.findOne({ user: req.user._id })) || (await Cart.create({ user: req.user._id, items: [] }));
  const existing = cart.items.find((item) => item.product.toString() === productId);

  if (existing) existing.quantity += Number(quantity);
  else cart.items.push({ product: productId, quantity });

  await cart.save();
  await trackActivity({ user: req.user._id, type: "add_to_cart", metadata: { productId, quantity } });

  res.status(StatusCodes.CREATED).json({ success: true, cart });
});

export const removeFromCart = catchAsync(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(StatusCodes.NOT_FOUND, "Cart not found");

  cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
  await cart.save();

  res.json({ success: true, cart });
});
