import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { User } from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

const signToken = (id, role) => jwt.sign({ id, role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(StatusCodes.CONFLICT, "Email already registered");

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hashed, role: "user" });

  res.status(StatusCodes.CREATED).json({
    success: true,
    token: signToken(user._id, user.role),
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials");

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials");

  user.lastActiveAt = new Date();
  await user.save();

  res.json({
    success: true,
    token: signToken(user._id, user.role),
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

export const profile = catchAsync(async (req, res) => {
  res.json({ success: true, user: req.user });
});
