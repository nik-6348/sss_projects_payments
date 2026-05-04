import test from "node:test";
import assert from "node:assert/strict";
import { authorize, resourceOwnerOrAdmin } from "../middleware/auth.js";
import errorHandler from "../middleware/errorHandler.js";

const createResponse = ({ headersSent = false } = {}) => ({
  headersSent,
  statusCode: undefined,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

test("authorize rejects requests without an authenticated user", () => {
  const req = {};
  const res = createResponse();
  let nextCalled = false;

  authorize("admin")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, "Not authorized, please login first");
});

test("authorize rejects users with disallowed roles", () => {
  const req = { user: { role: "user" } };
  const res = createResponse();
  let nextCalled = false;

  authorize("admin", "manager")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body.error, /not authorized/);
});

test("authorize allows users with an accepted role", () => {
  const req = { user: { role: "manager" } };
  const res = createResponse();
  let nextCalled = false;

  authorize("admin", "manager")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, undefined);
});

test("resourceOwnerOrAdmin lets admins and managers access any resource", () => {
  const req = {
    user: { role: "admin", _id: { toString: () => "admin-id" } },
    params: { user_id: "other-user" },
  };
  const res = createResponse();
  let nextCalled = false;

  resourceOwnerOrAdmin("user_id")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, undefined);
});

test("resourceOwnerOrAdmin allows a normal user to access own resource", () => {
  const req = {
    user: { role: "user", _id: { toString: () => "user-1" } },
    body: { owner_id: { toString: () => "user-1" } },
    params: {},
  };
  const res = createResponse();
  let nextCalled = false;

  resourceOwnerOrAdmin("owner_id")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, undefined);
});

test("resourceOwnerOrAdmin rejects missing or mismatched owner ids", () => {
  const missingReq = {
    user: { role: "user", _id: { toString: () => "user-1" } },
    body: {},
    params: {},
  };
  const missingRes = createResponse();

  resourceOwnerOrAdmin("owner_id")(missingReq, missingRes, () => {});

  assert.equal(missingRes.statusCode, 400);
  assert.equal(missingRes.body.error, "Resource user ID not found");

  const mismatchReq = {
    user: { role: "user", _id: { toString: () => "user-1" } },
    body: {},
    params: { owner_id: { toString: () => "user-2" } },
  };
  const mismatchRes = createResponse();

  resourceOwnerOrAdmin("owner_id")(mismatchReq, mismatchRes, () => {});

  assert.equal(mismatchRes.statusCode, 403);
  assert.equal(mismatchRes.body.error, "Not authorized to access this resource");
});

test("errorHandler converts Mongoose cast errors to 404 responses", () => {
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    const err = new Error("Cast failed");
    err.name = "CastError";
    const res = createResponse();

    errorHandler(err, { method: "GET", path: "/api/projects/bad-id" }, res, () => {});

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, "Resource not found");
  } finally {
    console.error = originalConsoleError;
  }
});

test("errorHandler converts duplicate key errors to clear 400 responses", () => {
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    const err = new Error("duplicate key");
    err.code = 11000;
    err.keyValue = { email: "client@example.com" };
    const res = createResponse();

    errorHandler(err, { method: "POST", path: "/api/clients" }, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, "Email 'client@example.com' already exists");
  } finally {
    console.error = originalConsoleError;
  }
});

test("errorHandler converts validation errors to 400 responses", () => {
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    const err = new Error("validation failed");
    err.name = "ValidationError";
    err.errors = {
      amount: { message: "Amount cannot be negative" },
      name: { message: "Name is required" },
    };
    const res = createResponse();

    errorHandler(err, { method: "POST", path: "/api/invoices" }, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, "Amount cannot be negative. Name is required");
  } finally {
    console.error = originalConsoleError;
  }
});

test("errorHandler delegates when headers are already sent", () => {
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    const err = new Error("late failure");
    const res = createResponse({ headersSent: true });
    let delegatedError;

    errorHandler(err, { method: "GET", path: "/" }, res, (nextErr) => {
      delegatedError = nextErr;
    });

    assert.equal(res.statusCode, undefined);
    assert.equal(delegatedError, err);
  } finally {
    console.error = originalConsoleError;
  }
});
