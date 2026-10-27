import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { Product } from "../src/models/Product.js";
import { Cart } from "../src/models/Cart.js";
import { Order } from "../src/models/Order.js";
import { Wishlist } from "../src/models/Wishlist.js";
import { Activity } from "../src/models/Activity.js";

const app = createApp();
let mongo;

const api = () => request(app);
const auth = (token) => ({ Authorization: `Bearer ${token}` });

const registerUser = async (overrides = {}) => {
  const payload = {
    name: "Test User",
    email: `user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    password: "SuperSecret123",
    ...overrides
  };
  const response = await api().post("/api/v1/auth/register").send(payload);
  return { statusCode: response.statusCode, body: response.body, payload };
};

const makeAdmin = async (token) => {
  const me = await api().get("/api/v1/auth/me").set(auth(token));
  await User.updateOne({ _id: me.body.user.id }, { role: "admin" });
  return me.body.user.id;
};

const createProduct = async (token, overrides = {}) => {
  const response = await api()
    .post("/api/v1/products")
    .set(auth(token))
    .send({
      title: `Test product ${Math.random().toString(16).slice(2)}`,
      category: "Testing",
      price: 25,
      inventory: 10,
      description: "A product created by the integration suite",
      ...overrides
    });
  return response;
};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Wishlist.deleteMany({}),
    Activity.deleteMany({})
  ]);
});

describe("auth", () => {
  it("registers a user and never exposes the password", async () => {
    const response = await registerUser();
    expect(response.statusCode).toBe(201);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user).toMatchObject({ name: "Test User", role: "user" });
    expect(response.body.user.password).toBeUndefined();

    const stored = await User.findOne({ email: response.payload.email }).select("+password");
    expect(stored.password).not.toBe(response.payload.password);
  });

  it("rejects duplicate emails and weak passwords", async () => {
    const first = await registerUser();
    const duplicate = await registerUser({ email: first.payload.email });
    expect(duplicate.statusCode).toBe(409);

    const weak = await registerUser({ password: "short" });
    expect(weak.statusCode).toBe(400);
    expect(weak.body.success).toBe(false);
  });

  it("logs in with valid credentials and returns a normalized profile", async () => {
    const { payload } = await registerUser();
    const login = await api()
      .post("/api/v1/auth/login")
      .send({ email: payload.email, password: payload.password });
    expect(login.statusCode).toBe(200);

    const me = await api().get("/api/v1/auth/me").set(auth(login.body.token));
    expect(me.statusCode).toBe(200);
    expect(me.body.user.id).toBeTruthy();
    expect(me.body.user.email).toBe(payload.email);
    expect(me.body.user.password).toBeUndefined();
  });

  it("rejects wrong credentials", async () => {
    const { payload } = await registerUser();
    const login = await api()
      .post("/api/v1/auth/login")
      .send({ email: payload.email, password: "WrongPassword123" });
    expect(login.statusCode).toBe(401);
  });

  it("survives malformed and missing bearer tokens", async () => {
    const malformed = await api().get("/api/v1/auth/me").set(auth("not-a-jwt"));
    expect(malformed.statusCode).toBe(401);

    const missing = await api().get("/api/v1/auth/me");
    expect(missing.statusCode).toBe(401);

    const health = await api().get("/api/v1/health");
    expect(health.statusCode).toBe(200);
  });
});

describe("products", () => {
  it("forbids non-admins from writing and validates payloads", async () => {
    const { body } = await registerUser();
    const forbidden = await createProduct(body.token);
    expect(forbidden.statusCode).toBe(403);

    await makeAdmin(body.token);
    const invalid = await createProduct(body.token, { price: -5, title: "x" });
    expect(invalid.statusCode).toBe(400);
  });

  it("lets admins create, update and delete products", async () => {
    const { body } = await registerUser();
    await makeAdmin(body.token);

    const created = await createProduct(body.token);
    expect(created.statusCode).toBe(201);
    const productId = created.body.product._id;

    const updated = await api()
      .put(`/api/v1/products/${productId}`)
      .set(auth(body.token))
      .send({ price: 42.5, inventory: 3 });
    expect(updated.statusCode).toBe(200);
    expect(updated.body.product.price).toBe(42.5);

    const list = await api().get("/api/v1/products?q=Test&limit=5");
    expect(list.statusCode).toBe(200);
    expect(list.body.items.length).toBeGreaterThan(0);

    const categories = await api().get("/api/v1/products/categories");
    expect(categories.statusCode).toBe(200);
    expect(categories.body.categories).toContain("Testing");

    const detail = await api().get(`/api/v1/products/${productId}`);
    expect(detail.statusCode).toBe(200);
    expect(detail.body.product._id).toBe(productId);

    const deleted = await api().delete(`/api/v1/products/${productId}`).set(auth(body.token));
    expect(deleted.statusCode).toBe(200);
    expect(await Product.findById(productId)).toBeNull();
  });
});

describe("cart and wishlist", () => {
  const setup = async () => {
    const { body } = await registerUser();
    await makeAdmin(body.token);
    const product = (await createProduct(body.token, { inventory: 5 })).body.product;
    return { token: body.token, product };
  };

  it("adds, caps, updates and removes cart items", async () => {
    const { token, product } = await setup();

    const added = await api()
      .post("/api/v1/cart")
      .set(auth(token))
      .send({ productId: product._id, quantity: 2 });
    expect(added.statusCode).toBe(201);
    expect(added.body.cart.items).toHaveLength(1);

    const overStock = await api()
      .post("/api/v1/cart")
      .set(auth(token))
      .send({ productId: product._id, quantity: 4 });
    expect(overStock.statusCode).toBe(400);

    const updated = await api()
      .patch(`/api/v1/cart/${product._id}`)
      .set(auth(token))
      .send({ quantity: 5 });
    expect(updated.statusCode).toBe(200);
    expect(updated.body.cart.items[0].quantity).toBe(5);

    const removed = await api()
      .patch(`/api/v1/cart/${product._id}`)
      .set(auth(token))
      .send({ quantity: 0 });
    expect(removed.statusCode).toBe(200);
    expect(removed.body.cart.items).toHaveLength(0);
  });

  it("stores wishlist entries idempotently", async () => {
    const { token, product } = await setup();

    const first = await api()
      .post("/api/v1/wishlist")
      .set(auth(token))
      .send({ productId: product._id });
    expect(first.statusCode).toBe(201);

    const second = await api()
      .post("/api/v1/wishlist")
      .set(auth(token))
      .send({ productId: product._id });
    expect(second.statusCode).toBe(201);
    expect(second.body.wishlist.products).toHaveLength(1);

    const removed = await api()
      .delete(`/api/v1/wishlist/${product._id}`)
      .set(auth(token));
    expect(removed.statusCode).toBe(200);
    expect(removed.body.wishlist.products).toHaveLength(0);
  });
});

describe("checkout", () => {
  const setup = async () => {
    const { body } = await registerUser();
    await makeAdmin(body.token);
    const product = (await createProduct(body.token, { price: 10, inventory: 8 })).body.product;
    return { token: body.token, userId: body.user.id, product };
  };

  it("decrements inventory, clears the cart and creates an order", async () => {
    const { token, product } = await setup();
    await api().post("/api/v1/cart").set(auth(token)).send({ productId: product._id, quantity: 3 });

    const checkout = await api().post("/api/v1/orders/checkout").set(auth(token));
    expect(checkout.statusCode).toBe(201);
    expect(checkout.body.order.totalAmount).toBe(30);
    expect(checkout.body.order.status).toBe("pending");

    const refreshed = await Product.findById(product._id);
    expect(refreshed.inventory).toBe(5);
    expect(refreshed.totalSold).toBe(3);

    const cart = await Cart.findOne({ user: checkout.body.order.user });
    expect(cart.items).toHaveLength(0);

    const mine = await api().get("/api/v1/orders/my").set(auth(token));
    expect(mine.body.orders).toHaveLength(1);
  });

  it("rolls back partial inventory changes when a later item is unavailable", async () => {
    const { token, product } = await setup();
    const scarce = (
      await createProduct(token, { price: 5, inventory: 4 })
    ).body.product;

    await api().post("/api/v1/cart").set(auth(token)).send({ productId: product._id, quantity: 2 });
    await api().post("/api/v1/cart").set(auth(token)).send({ productId: scarce._id, quantity: 3 });

    await Product.updateOne({ _id: scarce._id }, { inventory: 1 });

    const checkout = await api().post("/api/v1/orders/checkout").set(auth(token));
    expect(checkout.statusCode).toBe(409);

    const original = await Product.findById(product._id);
    expect(original.inventory).toBe(8);
    expect(original.totalSold).toBe(0);
    expect(await Order.countDocuments()).toBe(0);
  });

  it("restocks inventory when an admin cancels and blocks reopening", async () => {
    const { token, product } = await setup();
    await api().post("/api/v1/cart").set(auth(token)).send({ productId: product._id, quantity: 2 });
    const checkout = await api().post("/api/v1/orders/checkout").set(auth(token));
    const orderId = checkout.body.order._id;

    const cancelled = await api()
      .patch(`/api/v1/orders/${orderId}/status`)
      .set(auth(token))
      .send({ status: "cancelled" });
    expect(cancelled.statusCode).toBe(200);

    const restocked = await Product.findById(product._id);
    expect(restocked.inventory).toBe(8);
    expect(restocked.totalSold).toBe(0);

    const reopened = await api()
      .patch(`/api/v1/orders/${orderId}/status`)
      .set(auth(token))
      .send({ status: "processing" });
    expect(reopened.statusCode).toBe(400);
  });

  it("rejects checkout with an empty cart", async () => {
    const { token } = await setup();
    const checkout = await api().post("/api/v1/orders/checkout").set(auth(token));
    expect(checkout.statusCode).toBe(400);
  });
});

describe("admin", () => {
  it("guards admin routes and lets admins change other users' roles", async () => {
    const admin = await registerUser();
    const adminId = await makeAdmin(admin.body.token);
    const target = await registerUser();

    const forbidden = await api().get("/api/v1/admin/users").set(auth(target.body.token));
    expect(forbidden.statusCode).toBe(403);

    const users = await api().get("/api/v1/admin/users").set(auth(admin.body.token));
    expect(users.statusCode).toBe(200);
    expect(users.body.users.every((user) => user.password === undefined)).toBe(true);

    const promote = await api()
      .patch(`/api/v1/admin/users/${target.body.user.id}/role`)
      .set(auth(admin.body.token))
      .send({ role: "admin" });
    expect(promote.statusCode).toBe(200);
    expect(promote.body.user.role).toBe("admin");

    const self = await api()
      .patch(`/api/v1/admin/users/${adminId}/role`)
      .set(auth(admin.body.token))
      .send({ role: "user" });
    expect(self.statusCode).toBe(400);

    const invalid = await api()
      .patch(`/api/v1/admin/users/${target.body.user.id}/role`)
      .set(auth(admin.body.token))
      .send({ role: "superuser" });
    expect(invalid.statusCode).toBe(400);
  });

  it("returns dashboard data even when the analytics service is unavailable", async () => {
    const admin = await registerUser();
    await makeAdmin(admin.body.token);

    const dashboard = await api().get("/api/v1/admin/dashboard").set(auth(admin.body.token));
    expect(dashboard.statusCode).toBe(200);
    expect(dashboard.body.stats).toBeDefined();
    expect(Array.isArray(dashboard.body.salesTrend)).toBe(true);
  });

  it("returns fallbacks for advanced analytics when the ML service is down", async () => {
    const admin = await registerUser();
    await makeAdmin(admin.body.token);

    const analytics = await api()
      .get("/api/v1/admin/advanced-analytics")
      .set(auth(admin.body.token));
    expect(analytics.statusCode).toBe(200);
    expect(Array.isArray(analytics.body.recommendations.recommendations)).toBe(true);
    expect(Array.isArray(analytics.body.segments.segments)).toBe(true);
  });

  it("serves personalized recommendations without invalid product ids", async () => {
    const { body } = await registerUser();

    const recommendation = await api()
      .get("/api/v1/analytics/recommendations")
      .set(auth(body.token));
    expect(recommendation.statusCode).toBe(200);
    expect(Array.isArray(recommendation.body.recommendations)).toBe(true);
    expect(recommendation.body.recommendations.every((product) => product._id)).toBe(true);
  });
});
