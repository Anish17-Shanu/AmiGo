import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { generateDescription } from "../services/descriptionGenerator.js";
import { logger } from "../config/logger.js";

const defaultProducts = [
  { title: "AmiGo Smart Fitness Watch", category: "Electronics", price: 89, inventory: 100, tags: ["wearable", "health", "bluetooth"] },
  { title: "Ergo Mesh Office Chair", category: "Furniture", price: 149, inventory: 65, tags: ["ergonomic", "office", "comfort"] },
  { title: "Noise-Canceling Headphones", category: "Electronics", price: 129, inventory: 80, tags: ["audio", "travel", "premium"] },
  { title: "Thermal Steel Bottle", category: "Lifestyle", price: 19, inventory: 260, tags: ["hydration", "outdoor", "eco"] },
  { title: "Organic Protein Mix", category: "Health", price: 39, inventory: 120, tags: ["nutrition", "fitness", "vegan"] },
  { title: "Desk Lamp Pro", category: "Home", price: 29, inventory: 90, tags: ["lighting", "minimal", "study"] }
];

export const bootstrapDataIfEmpty = async () => {
  const userCount = await User.countDocuments();
  if (userCount > 0) return;

  const adminPwd = await bcrypt.hash("Admin@123", 12);
  const userPwd = await bcrypt.hash("User@123", 12);

  await User.create([
    { name: "AmiGo Admin", email: "admin@amigo.com", password: adminPwd, role: "admin" },
    { name: "Demo User", email: "user@amigo.com", password: userPwd, role: "user" }
  ]);

  await Product.insertMany(
    defaultProducts.map((p) => ({
      ...p,
      description: generateDescription(p),
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(p.title)}/640/480`
    }))
  );

  logger.info("Bootstrap demo data inserted");
};
