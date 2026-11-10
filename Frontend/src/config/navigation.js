function normalizeOrigin(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export function buildAppDestination({ configuredOrigin, path, isDevelopment = false, developmentOrigin = null }) {
  const origin = configuredOrigin?.trim()
    ? normalizeOrigin(configuredOrigin)
    : isDevelopment
      ? normalizeOrigin(developmentOrigin)
      : null;

  if (!origin || typeof path !== "string" || !path.startsWith("/")) return null;
  return new URL(path, origin).toString();
}

export function getLandingLoginUrl() {
  return buildAppDestination({
    configuredOrigin: import.meta.env?.VITE_LANDING_ORIGIN,
    path: "/login",
    isDevelopment: Boolean(import.meta.env?.DEV),
    developmentOrigin: "http://localhost:5174",
  });
}
