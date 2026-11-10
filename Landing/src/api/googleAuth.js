export function buildGoogleLoginUrl(backendUrl) {
  let apiBase;
  try {
    apiBase = new URL(backendUrl);
  } catch {
    throw new Error("The backend API URL is not configured correctly.");
  }

  if (!["http:", "https:"].includes(apiBase.protocol) || apiBase.username || apiBase.password) {
    throw new Error("The backend API URL is not configured correctly.");
  }

  const basePath = apiBase.pathname.replace(/\/+$/, "");
  const apiPrefixCount = basePath.match(/\/api\/v1/g)?.length ?? 0;
  if (!basePath.endsWith("/api/v1") || apiPrefixCount !== 1) {
    throw new Error("VITE_BACKEND_URL must include the /api/v1 API prefix.");
  }

  apiBase.pathname = `${basePath}/auth/google-login`;
  apiBase.search = "";
  apiBase.hash = "";
  return apiBase.toString();
}

export async function postGoogleAuthCode(backendUrl, code, fetchImpl = fetch) {
  const response = await fetchImpl(buildGoogleLoginUrl(backendUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
    credentials: "include",
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Empty and non-JSON error responses still produce a useful status message below.
  }

  if (!response.ok || body?.success !== true) {
    const error = new Error(
      body?.error || body?.message || `Google authentication failed (${response.status}).`
    );
    error.status = response.status;
    throw error;
  }

  return body;
}
