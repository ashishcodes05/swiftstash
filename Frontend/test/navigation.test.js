import test from "node:test";
import assert from "node:assert/strict";
import { buildAppDestination } from "../src/config/navigation.js";

test("builds the Landing login URL from the configured origin", () => {
  assert.equal(
    buildAppDestination({ configuredOrigin: "https://auth.example.test/", path: "/login" }),
    "https://auth.example.test/login"
  );
});

test("uses the local Landing origin only in development", () => {
  assert.equal(
    buildAppDestination({
      path: "/login",
      isDevelopment: true,
      developmentOrigin: "http://localhost:5174",
    }),
    "http://localhost:5174/login"
  );
  assert.equal(buildAppDestination({ path: "/login" }), null);
});

test("rejects invalid origins and destination paths", () => {
  assert.equal(
    buildAppDestination({ configuredOrigin: "https://example.test/path", path: "/login" }),
    null
  );
  assert.equal(
    buildAppDestination({ configuredOrigin: "https://example.test", path: "login" }),
    null
  );
});
