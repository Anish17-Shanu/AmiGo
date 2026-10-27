import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Activity } from "../models/Activity.js";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { Wishlist } from "../models/Wishlist.js";
import { generateDescription } from "../services/descriptionGenerator.js";

const DEMO_PASSWORD = "User@123";
const ADMIN_PASSWORD = "Admin@123";

const productCatalog = [
  { title: "AmiGo Smart Fitness Watch", category: "Electronics", price: 89, inventory: 140, rating: 4.6, tags: ["wearable", "health", "bluetooth"] },
  { title: "Noise-Canceling Headphones", category: "Electronics", price: 129, inventory: 120, rating: 4.7, tags: ["audio", "travel", "premium"] },
  { title: "Portable Bluetooth Speaker", category: "Electronics", price: 59, inventory: 160, rating: 4.4, tags: ["audio", "outdoor", "portable"] },
  { title: "4K Action Camera", category: "Electronics", price: 199, inventory: 70, rating: 4.5, tags: ["camera", "travel", "adventure"] },
  { title: "Wireless Charging Pad", category: "Electronics", price: 35, inventory: 180, rating: 4.2, tags: ["charging", "desk", "minimal"] },
  { title: "Ergo Mesh Office Chair", category: "Furniture", price: 149, inventory: 90, rating: 4.6, tags: ["ergonomic", "office", "comfort"] },
  { title: "Standing Desk Converter", category: "Furniture", price: 179, inventory: 55, rating: 4.4, tags: ["office", "ergonomic", "workspace"] },
  { title: "Modular Bookshelf", category: "Furniture", price: 129, inventory: 75, rating: 4.3, tags: ["storage", "minimal", "home"] },
  { title: "Lounge Accent Chair", category: "Furniture", price: 249, inventory: 40, rating: 4.5, tags: ["lounge", "comfort", "premium"] },
  { title: "Organic Protein Mix", category: "Health", price: 39, inventory: 220, rating: 4.5, tags: ["nutrition", "fitness", "vegan"] },
  { title: "Deep Sleep Magnesium", category: "Health", price: 24, inventory: 190, rating: 4.3, tags: ["sleep", "wellness", "recovery"] },
  { title: "Foam Roller Pro", category: "Health", price: 29, inventory: 170, rating: 4.4, tags: ["recovery", "fitness", "mobility"] },
  { title: "Herbal Immunity Tea", category: "Health", price: 18, inventory: 240, rating: 4.2, tags: ["wellness", "tea", "immunity"] },
  { title: "Desk Lamp Pro", category: "Home", price: 29, inventory: 150, rating: 4.4, tags: ["lighting", "minimal", "study"] },
  { title: "Ceramic Pour-Over Set", category: "Home", price: 49, inventory: 110, rating: 4.6, tags: ["coffee", "kitchen", "ceramic"] },
  { title: "Smart Air Purifier", category: "Home", price: 159, inventory: 65, rating: 4.5, tags: ["air", "health", "smart"] },
  { title: "Linen Throw Blanket", category: "Home", price: 45, inventory: 130, rating: 4.3, tags: ["cozy", "bedroom", "linen"] },
  { title: "Thermal Steel Bottle", category: "Lifestyle", price: 19, inventory: 260, rating: 4.5, tags: ["hydration", "outdoor", "eco"] },
  { title: "Everyday Canvas Backpack", category: "Lifestyle", price: 69, inventory: 100, rating: 4.4, tags: ["travel", "commute", "canvas"] },
  { title: "Minimalist Wallet", category: "Lifestyle", price: 39, inventory: 150, rating: 4.3, tags: ["leather", "travel", "minimal"] },
  { title: "All-Weather Umbrella", category: "Lifestyle", price: 27, inventory: 140, rating: 4.1, tags: ["rain", "commute", "durable"] },
  { title: "Trail Running Shoes", category: "Fitness", price: 119, inventory: 95, rating: 4.7, tags: ["running", "outdoor", "performance"] },
  { title: "Yoga Mat Pro", category: "Fitness", price: 49, inventory: 160, rating: 4.5, tags: ["yoga", "fitness", "non-slip"] },
  { title: "Adjustable Dumbbell Set", category: "Fitness", price: 129, inventory: 60, rating: 4.6, tags: ["strength", "home-gym", "fitness"] }
];

const customerProfiles = [
  { name: "Aarav Sharma", email: "aarav.sharma@example.com", orders: 14, affinity: ["Electronics", "Fitness"], activeHoursAgo: 2 },
  { name: "Meera Iyer", email: "meera.iyer@example.com", orders: 11, affinity: ["Home", "Health"], activeHoursAgo: 5 },
  { name: "Rohan Verma", email: "rohan.verma@example.com", orders: 8, affinity: ["Electronics"], activeHoursAgo: 18 },
  { name: "Priya Nair", email: "priya.nair@example.com", orders: 7, affinity: ["Home", "Lifestyle"], activeHoursAgo: 30 },
  { name: "Kabir Singh", email: "kabir.singh@example.com", orders: 6, affinity: ["Fitness", "Health"], activeHoursAgo: 44 },
  { name: "Ananya Rao", email: "ananya.rao@example.com", orders: 4, affinity: ["Health"], activeHoursAgo: 52 },
  { name: "Dev Patel", email: "dev.patel@example.com", orders: 3, affinity: ["Lifestyle", "Electronics"], activeHoursAgo: 70 },
  { name: "Sara Khan", email: "sara.khan@example.com", orders: 1, affinity: ["Electronics"], activeHoursAgo: 3 },
  { name: "Nikhil Joshi", email: "nikhil.joshi@example.com", orders: 1, affinity: ["Health", "Fitness"], activeHoursAgo: 96 }
];

const demoProfile = {
  name: "Demo User",
  email: "user@amigo.com",
  orders: 5,
  affinity: ["Electronics", "Fitness", "Health"],
  activeHoursAgo: 1,
  fixedTitles: [
    "AmiGo Smart Fitness Watch",
    "Trail Running Shoes",
    "Organic Protein Mix",
    "Foam Roller Pro"
  ]
};

const mulberry32 = (seed) => {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const pickWeighted = (weights, random) => {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let threshold = random() * total;
  for (let index = 0; index < weights.length; index += 1) {
    threshold -= weights[index];
    if (threshold <= 0) return index;
  }
  return weights.length - 1;
};

const roundCurrency = (value) => Math.round(value * 100) / 100;

const buildOrders = ({ profiles, products, now }) => {
  const random = mulberry32(20261028);
  const byTitle = new Map(products.map((product) => [product.title, product]));
  const dayWeights = Array.from({ length: 28 }, (_, offset) => {
    const day = new Date(now);
    day.setDate(day.getDate() - offset);
    return day.getDay() === 0 || day.getDay() === 6 ? 1.8 : 1.0;
  });

  const orderDocs = [];
  const activityDocs = [];

  for (const profile of profiles) {
    const affinityPool = products.filter((product) => profile.affinity.includes(product.category));

    for (let index = 0; index < profile.orders; index += 1) {
      const daysAgo = pickWeighted(dayWeights, random);
      const placedAt = new Date(now);
      placedAt.setDate(placedAt.getDate() - daysAgo);
      const latestHour = daysAgo === 0 ? Math.max(9, now.getHours() - 1) : 21;
      placedAt.setHours(8 + Math.floor(random() * (latestHour - 7)), Math.floor(random() * 60), 0, 0);

      let status;
      const canCancel = !profile.fixedTitles && daysAgo > 1;
      if (canCancel && random() < 0.05) {
        status = "cancelled";
      } else if (daysAgo >= 10) {
        status = "delivered";
      } else if (daysAgo >= 4) {
        status = "shipped";
      } else if (daysAgo >= 2) {
        status = "processing";
      } else {
        status = "pending";
      }

      const selected = [];
      if (profile.fixedTitles && index < profile.fixedTitles.length) {
        selected.push(byTitle.get(profile.fixedTitles[index]));
      }
      const itemTarget = 1 + Math.floor(random() * 3);
      let attempts = 0;
      while (selected.length < itemTarget && attempts < 12) {
        attempts += 1;
        const pool = profile.affinity.length && random() < 0.75 ? affinityPool : products;
        const candidate = pool[Math.floor(random() * pool.length)];
        if (candidate && !selected.includes(candidate)) selected.push(candidate);
      }

      const items = selected.filter(Boolean).map((product) => ({
        product: product._id,
        titleSnapshot: product.title,
        priceSnapshot: product.price,
        quantity: random() < 0.7 ? 1 : 2
      }));
      if (!items.length) continue;

      const totalAmount = roundCurrency(
        items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0)
      );
      const orderId = new mongoose.Types.ObjectId();
      const timestamp = { createdAt: placedAt, updatedAt: placedAt };

      orderDocs.push({
        _id: orderId,
        user: profile.user._id,
        items,
        totalAmount,
        status,
        paymentStatus: "simulated_paid",
        ...timestamp,
        __v: 0
      });

      activityDocs.push({
        user: profile.user._id,
        type: "checkout",
        metadata: { orderId, totalAmount },
        ...timestamp,
        __v: 0
      });
    }
  }

  return { orderDocs, activityDocs };
};

export const seedDemoData = async ({ reset = false } = {}) => {
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0 && !reset) {
    return { skipped: true, reason: "database already seeded" };
  }

  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Cart.deleteMany({}),
    Wishlist.deleteMany({}),
    Activity.deleteMany({})
  ]);

  const [adminHash, customerHash] = await Promise.all([
    bcrypt.hash(ADMIN_PASSWORD, 12),
    bcrypt.hash(DEMO_PASSWORD, 12)
  ]);
  const now = new Date();

  const admin = await User.create({
    name: "AmiGo Admin",
    email: "admin@amigo.com",
    password: adminHash,
    role: "admin",
    lastActiveAt: new Date(now.getTime() - 30 * 60 * 1000)
  });

  const demoUser = await User.create({
    name: demoProfile.name,
    email: demoProfile.email,
    password: customerHash,
    role: "user",
    lastActiveAt: new Date(now.getTime() - demoProfile.activeHoursAgo * 60 * 60 * 1000)
  });

  const customers = await User.insertMany(
    customerProfiles.map((profile) => ({
      name: profile.name,
      email: profile.email,
      password: customerHash,
      role: "user",
      lastActiveAt: new Date(now.getTime() - profile.activeHoursAgo * 60 * 60 * 1000)
    }))
  );

  const products = await Product.insertMany(
    productCatalog.map((product) => ({
      ...product,
      description: generateDescription(product),
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(product.title)}/640/480`,
      totalSold: 0,
      popularityScore: 0
    }))
  );

  const profiles = [
    { ...demoProfile, user: demoUser },
    ...customerProfiles.map((profile, index) => ({ ...profile, user: customers[index] }))
  ];
  const { orderDocs, activityDocs } = buildOrders({ profiles, products, now });

  await Order.collection.insertMany(orderDocs);

  const soldByProduct = new Map();
  for (const order of orderDocs) {
    if (order.status === "cancelled") continue;
    for (const item of order.items) {
      const key = String(item.product);
      soldByProduct.set(key, (soldByProduct.get(key) || 0) + item.quantity);
    }
  }

  await Promise.all(
    products.map((product) => {
      const sold = soldByProduct.get(String(product._id)) || 0;
      return Product.updateOne(
        { _id: product._id },
        {
          $set: {
            totalSold: sold,
            popularityScore: sold * 2,
            inventory: Math.max(12, product.inventory - sold)
          }
        }
      );
    })
  );

  const wishlistTitles = ["Noise-Canceling Headphones", "Ceramic Pour-Over Set", "Everyday Canvas Backpack"];
  const wishlistProducts = wishlistTitles
    .map((title) => products.find((product) => product.title === title)?._id)
    .filter(Boolean);
  await Wishlist.create({ user: demoUser._id, products: wishlistProducts });
  await Cart.create({ user: demoUser._id, items: [] });

  activityDocs.push({
    user: demoUser._id,
    type: "add_to_cart",
    metadata: { productId: wishlistProducts[0], quantity: 1 },
    createdAt: new Date(now.getTime() - 45 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 45 * 60 * 1000),
    __v: 0
  });
  await Activity.collection.insertMany(activityDocs);

  const revenue = orderDocs
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  return {
    skipped: false,
    products: products.length,
    users: 1 + 1 + customers.length,
    orders: orderDocs.length,
    revenue: roundCurrency(revenue),
    adminId: String(admin._id),
    demoUserId: String(demoUser._id)
  };
};
