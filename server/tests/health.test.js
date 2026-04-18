import request from "supertest";
import { createApp } from "../src/app.js";

describe("health route", () => {
  it("returns success", async () => {
    const app = createApp();
    const response = await request(app).get("/api/v1/health");
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
