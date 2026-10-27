import { StatusCodes } from "http-status-codes";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";
import { trackActivity } from "../services/realtimeService.js";

const loadCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart) return { user: userId, items: [] };

  const validItems = cart.items.filter((item) => item.product);
  if (validItems.length !== cart.items.length) {
    cart.items = validItems.map((item) => ({ product: item.product._id, quantity: item.quantity }));
    await cart.save();
  }

  return cart;
};

export const getCart = catchAsync(async (req, res) => {
  const cart = await loadCart(req.user._id);
  res.json({ success: true, cart });
});

export const addToCart = catchAsync(async (req, res) => {
  const { productId } = req.body;
  const quantity = Number(req.body.quantity ?? 1);

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  if (product.inventory < 1) throw new ApiError(StatusCodes.BAD_REQUEST, "Product is out of stock");

  const cart =
    (await Cart.findOne({ user: req.user._id })) ||
    (await Cart.create({ user: req.user._id, items: [] }));

  const existing = cart.items.find((item) => item.product.toString() === productId);
  const nextQuantity = (existing?.quantity || 0) + quantity;
  if (nextQuantity > product.inventory) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Only ${product.inventory} unit(s) of ${product.title} available`
    );
  }

  if (existing) existing.quantity = nextQuantity;
  else cart.items.push({ product: productId, quantity });

  await cart.save();
  await trackActivity({ user: req.user._id, type: "add_to_cart", metadata: { productId, quantity } });

  const populated = await loadCart(req.user._id);
  res.status(StatusCodes.CREATED).json({ success: true, cart: populated });
});

export const updateCartItem = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const quantity = Number(req.body.quantity);

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(StatusCodes.NOT_FOUND, "Cart not found");

  const item = cart.items.find((entry) => entry.product.toString() === productId);
  if (!item) throw new ApiError(StatusCodes.NOT_FOUND, "Item is not in the cart");

  if (quantity === 0) {
    cart.items = cart.items.filter((entry) => entry.product.toString() !== productId);
  } else {
    const product = await Product.findById(productId);
    if (!product) throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
    if (quantity > product.inventory) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Only ${product.inventory} unit(s) of ${product.title} available`
      );
    }
    item.quantity = quantity;
  }

  await cart.save();
  const populated = await loadCart(req.user._id);
  res.json({ success: true, cart: populated });
});

export const removeFromCart = catchAsync(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
    await cart.save();
  }

  const populated = await loadCart(req.user._id);
  res.json({ success: true, cart: populated });
});
