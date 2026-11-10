import assert from "node:assert/strict";
import { test } from "node:test";
import cookieParser from "cookie-parser";
import express from "express";
import serverless from "serverless-http";

Object.assign(process.env, {
  MONGO_URI: "mongodb://127.0.0.1:27017/lambda-cookie-test",
  ARGON_SECRET: "a".repeat(32),
  COOKIE_SECRET: "b".repeat(32),
  GOOGLE_CLIENT_ID: "lambda-cookie-test-client",
  GOOGLE_CLIENT_SECRET: "lambda-cookie-test-secret",
  RESEND_API_KEY: "lambda-cookie-test-key",
  AWS_REGION: "us-east-1",
  AWS_BUCKET_NAME: "lambda-cookie-test-bucket",
  REDIS_URL: "redis://127.0.0.1:6379",
  NODE_ENV: "test",
  CORS_ALLOWED_ORIGINS: "",
});

const { createLambdaHandler } = await import("../src/lambda.ts");
const { AuthController } = await import("../src/modules/auth/auth.controller.ts");
const { AuthService } = await import("../src/modules/auth/auth.service.ts");
const { SessionRepository } = await import("../src/modules/auth/session.repository.ts");

const createTestHandler = (routes) =>
  createLambdaHandler(async () => undefined, serverless(routes));

const request = (path, options = {}) => ({
  version: "2.0",
  routeKey: "$default",
  rawPath: path,
  rawQueryString: "",
  headers: { host: "cookie-test.example", ...(options.headers ?? {}) },
  ...(options.cookies ? { cookies: options.cookies } : {}),
  requestContext: {
    http: { method: options.method ?? "GET", path, sourceIp: "127.0.0.1" },
  },
  body: options.body ? JSON.stringify(options.body) : "",
  isBase64Encoded: false,
});

test("login's single cookie is returned in the v2 cookies array with attributes", async () => {
  const app = express();
  app.use(cookieParser("b".repeat(32)), express.json());
  app.post("/login", AuthController.loginUser);
  AuthService.validateUser = async () => "test-user";
  SessionRepository.enforceDeviceLimit = async () => undefined;
  SessionRepository.createSession = async () => "test-session";

  const response = await createTestHandler(app)(request("/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { email: "test@example.invalid", password: "test-password" },
  }), {});
  const cookie = response.cookies[0];

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), {
    success: true,
    message: "User Logged in Successfully",
  });
  assert.equal("set-cookie" in response.headers, false);
  assert.equal(response.cookies.length, 1);
  assert.match(cookie, /^sid=s%3Atest-session\./);
  assert.match(cookie, /; Path=\//);
  assert.match(cookie, /; Max-Age=604800/);
  assert.match(cookie, /; Expires=/);
  assert.match(cookie, /; HttpOnly/);
  assert.match(cookie, /; Secure/);
  assert.match(cookie, /; SameSite=Lax/);
});

test("logout's clearing cookie keeps its expiry attribute intact", async () => {
  const app = express();
  app.use(cookieParser("b".repeat(32)));
  app.post("/logout", AuthController.logoutUser);
  let deletedSession;
  SessionRepository.deleteSession = async (sessionId) => { deletedSession = sessionId; };

  const loginApp = express();
  loginApp.use(cookieParser("b".repeat(32)), express.json());
  loginApp.post("/login", AuthController.loginUser);
  AuthService.validateUser = async () => "test-user";
  SessionRepository.enforceDeviceLimit = async () => undefined;
  SessionRepository.createSession = async () => "test-session";
  const loginResponse = await createTestHandler(loginApp)(request("/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { email: "test@example.invalid", password: "test-password" },
  }), {});

  const response = await createTestHandler(app)(request("/logout", {
    method: "POST",
    cookies: loginResponse.cookies,
  }), {});
  const cookies = response.cookies;

  assert.equal(response.statusCode, 200);
  assert.equal(deletedSession, "test-session");
  assert.deepEqual(JSON.parse(response.body), {
    success: true,
    message: "User Logged out Successfully",
  });
  assert.equal(cookies.length, 1);
  assert.match(cookies[0], /^sid=;/);
  assert.match(cookies[0], /; Path=\//);
  assert.match(cookies[0], /; Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
});

test("multiple Set-Cookie values remain separate cookies", async () => {
  const app = express();
  app.get("/multiple", (_req, res) => {
    res.cookie("sid", "one", { httpOnly: true, secure: true });
    res.cookie("preference", "two", { sameSite: "lax" });
    return res.status(202).send("cookies set");
  });

  const response = await createTestHandler(app)(request("/multiple"), {});
  const cookies = response.cookies;

  assert.equal(response.statusCode, 202);
  assert.equal(response.body, "cookies set");
  assert.equal(cookies.length, 2);
  assert.match(cookies[0], /^sid=one;/);
  assert.match(cookies[0], /; HttpOnly/);
  assert.match(cookies[0], /; Secure/);
  assert.match(cookies[1], /^preference=two;/);
  assert.match(cookies[1], /; SameSite=Lax/);
});
