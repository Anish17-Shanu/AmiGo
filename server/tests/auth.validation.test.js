import request from "supertest";
import { createApp } from "../src/app.js";

describe("auth validation", () => {
  it("rejects invalid registration payload", async () => {
    const app = createApp();
    const response = await request(app).post("/api/v1/auth/register").send({ email: "bad" });
    expect(response.statusCode).toBe(400);
  });
});
