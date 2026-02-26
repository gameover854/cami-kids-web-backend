const test = require("node:test");
const { after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
process.env.NODE_ENV = "test";
const { app } = require("../server");
const prisma = require("../config/prisma");

test("POST /api/auth/login should return 422 for invalid email format", async () => {
  const res = await request(app).post("/api/auth/login").send({
    email: "invalid-email",
    password: "secret123",
  });

  assert.equal(res.status, 422);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Validation failed/i);
});

test("GET /api/products should return 401 when token is missing", async () => {
  const res = await request(app).get("/api/products");

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test("PUT /api/orders/:id/status should return 422 for invalid status", async () => {
  const loginRes = await request(app).post("/api/auth/login").send({
    email: "admin@cami.local",
    password: "admin123",
  });

  assert.equal(loginRes.status, 200);
  const token = loginRes.body?.data?.token;
  assert.ok(token);

  const res = await request(app)
    .put("/api/orders/1/status")
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "INVALID_STATUS" });

  assert.equal(res.status, 422);
  assert.equal(res.body.success, false);
});

after(async () => {
  await prisma.$disconnect();
});
