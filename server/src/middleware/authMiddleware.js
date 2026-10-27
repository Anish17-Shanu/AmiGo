import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { User } from "../models/User.js";

const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

export const protect = catchAsync(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.slice(7), env.jwtSecret);
  } catch {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired token");
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token user");

  if (!user.lastActiveAt || Date.now() - user.lastActiveAt.getTime() > ACTIVE_WINDOW_MS) {
    user.lastActiveAt = new Date();
    await user.save();
  }

  req.user = user;
  return next();
});

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(StatusCodes.FORBIDDEN, "Insufficient role"));
  }
  return next();
};
