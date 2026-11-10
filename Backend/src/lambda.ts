import serverless from "serverless-http";
import { app } from "./app.js";
import { initializeServices } from "./config/initializeServices.js";

const forwardRequest = serverless(app, { binary: ["application/zip"] });

type ForwardRequest = typeof forwardRequest;

type LambdaResponse = {
  headers?: Record<string, unknown>;
  cookies?: string[];
  [key: string]: unknown;
};

export const normalizeHttpApiV2Cookies = (response: Object): Object => {
  if (typeof response !== "object" || response === null) return response;

  const result = response as LambdaResponse;
  const headers = { ...(result.headers ?? {}) };
  const setCookieHeader = Object.keys(headers).find((name) => name.toLowerCase() === "set-cookie");
  const headerCookies = setCookieHeader ? headers[setCookieHeader] : undefined;

  if (setCookieHeader) delete headers[setCookieHeader];

  const cookies = [...(Array.isArray(result.cookies) ? result.cookies : [])];
  if (typeof headerCookies === "string") cookies.push(headerCookies);
  else if (Array.isArray(headerCookies)) {
    cookies.push(...headerCookies.filter((cookie): cookie is string => typeof cookie === "string"));
  }

  return { ...result, headers, cookies };
};

// Exported separately to make initialization ordering testable without connecting
// to external services or invoking AWS.
export const createLambdaHandler = (
  initialize: () => Promise<void> = initializeServices,
  forward: ForwardRequest = forwardRequest,
): ForwardRequest => async (event, context) => {
  await initialize();
  const response = await forward(event, context);
  return (event as { version?: unknown }).version === "2.0"
    ? normalizeHttpApiV2Cookies(response)
    : response;
};

export const handler = createLambdaHandler();
