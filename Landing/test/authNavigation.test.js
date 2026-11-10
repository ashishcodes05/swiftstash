import test from "node:test";
import assert from "node:assert/strict";
import { buildAppDestination, getRestoredUser } from "../src/config/navigation.js";
import { buildGoogleLoginUrl, postGoogleAuthCode } from "../src/api/googleAuth.js";

test("builds the main drive URL from the configured main app origin", () => {
  assert.equal(
    buildAppDestination({ configuredOrigin: "https://drive.example.test/", path: "/drive" }),
    "https://drive.example.test/drive"
  );
});

test("uses the local main app only in development and leaves production unconfigured", () => {
  assert.equal(
    buildAppDestination({
      path: "/drive",
      isDevelopment: true,
      developmentOrigin: "http://localhost:5173",
    }),
    "http://localhost:5173/drive"
  );
  assert.equal(buildAppDestination({ path: "/drive" }), null);
});

test("restores the user from the backend response data field", () => {
  const user = { id: "user-1" };
  assert.equal(getRestoredUser({ data: { success: true, data: user } }), user);
  assert.equal(getRestoredUser({ data: { success: false } }), null);
  assert.equal(getRestoredUser({ data: { success: true } }), null);
});

test("builds the Google login endpoint once after an API base containing /api/v1", () => {
  assert.equal(
    buildGoogleLoginUrl("https://api.example.test/stage/api/v1/"),
    "https://api.example.test/stage/api/v1/auth/google-login"
  );
  assert.throws(
    () => buildGoogleLoginUrl("https://api.example.test/api/v1/api/v1"),
    /must include the \/api\/v1 API prefix/
  );
});

test("sends Google auth codes with cookies and rejects unsuccessful HTTP responses", async () => {
  let request;
  const result = await postGoogleAuthCode(
    "https://api.example.test/api/v1",
    "test-code",
    async (url, options) => {
      request = { url, options };
      return { ok: true, status: 200, json: async () => ({ success: true }) };
    }
  );

  assert.equal(result.success, true);
  assert.equal(request.url, "https://api.example.test/api/v1/auth/google-login");
  assert.equal(request.options.credentials, "include");
  assert.equal(request.options.method, "POST");
  assert.deepEqual(JSON.parse(request.options.body), { code: "test-code" });

  await assert.rejects(
    postGoogleAuthCode("https://api.example.test/api/v1", "bad-code", async () => ({
      ok: false,
      status: 401,
      json: async () => ({ success: false, error: "Authentication rejected" }),
    })),
    (error) => error.status === 401 && error.message === "Authentication rejected"
  );
});

test("propagates Google authentication network failures", async () => {
  await assert.rejects(
    postGoogleAuthCode("https://api.example.test/api/v1", "test-code", async () => {
      throw new Error("Network unavailable");
    }),
    /Network unavailable/
  );
});
