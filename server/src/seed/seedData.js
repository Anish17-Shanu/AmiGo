import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { Cart } from "../models/Cart.js";
import { Wishlist } from "../models/Wishlist.js";
import { generateDescription } from "../services/descriptionGenerator.js";

dotenv.config();
let memoryServer = null;

const products = [
  { title: "AmiGo Smart Fitness Watch", category: "Electronics", price: 89, inventory: 100, tags: ["wearable", "health", "bluetooth"] },
  { title: "Ergo Mesh Office Chair", category: "Furniture", price: 149, inventory: 65, tags: ["ergonomic", "office", "comfort"] },
  { title: "Noise-Canceling Headphones", category: "Electronics", price: 129, inventory: 80, tags: ["audio", "travel", "premium"] },
  { title: "Thermal Steel Bottle", category: "Lifestyle", price: 19, inventory: 260, tags: ["hydration", "outdoor", "eco"] },
  { title: "Organic Protein Mix", category: "Health", price: 39, inventory: 120, tags: ["nutrition", "fitness", "vegan"] },
  { title: "Desk Lamp Pro", category: "Home", price: 29, inventory: 90, tags: ["lighting", "minimal", "study"] }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/amigo");
  } catch {
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
  }

  await Promise.all([User.deleteMany({}), Product.deleteMany({}), Order.deleteMany({}), Cart.deleteMany({}), Wishlist.deleteMany({})]);

  const adminPwd = await bcrypt.hash("Admin@123", 12);
  const userPwd = await bcrypt.hash("User@123", 12);

  const [admin, user] = await User.create([
    { name: "AmiGo Admin", email: "admin@amigo.com", password: adminPwd, role: "admin" },
    { name: "Demo User", email: "user@amigo.com", password: userPwd, role: "user" }
  ]);

  const insertedProducts = await Product.insertMany(
    products.map((p) => ({ ...p, description: generateDescription(p), imageUrl: `https://picsum.photos/seed/${encodeURIComponent(p.title)}/640/480` }))
  );

  await Cart.create({ user: user._id, items: [] });
  await Wishlist.create({ user: user._id, products: [insertedProducts[0]._id, insertedProducts[1]._id] });

  console.log("Seed completed");
  console.log("Admin: admin@amigo.com / Admin@123");
  console.log("User: user@amigo.com / User@123");

  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
};

seed();
