#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

if ! command -v podman >/dev/null 2>&1; then
  printf '%s\n' 'FAIL: Podman is not installed.' >&2
  exit 2
fi

if ! ROOTLESS="$(podman info --format '{{.Host.Security.Rootless}}' 2>/dev/null)"; then
  printf '%s\n' 'FAIL: Podman is not usable by the current user.' >&2
  exit 2
fi

if [[ "$ROOTLESS" != "true" ]]; then
  printf '%s\n' 'FAIL: Podman is not running rootless; refusing to continue.' >&2
  exit 2
fi

STAGING_DIR="$(mktemp -d "${TMPDIR:-/tmp}/swiftstash-al2023-check.XXXXXX")"
cleanup() {
  rm -rf -- "$STAGING_DIR"
}
trap cleanup EXIT INT TERM

# Copy only build inputs. This deliberately excludes .env files, node_modules,
# frontend/Landing trees, and all other repository content.
cp -- "$BACKEND_DIR/package.json" "$BACKEND_DIR/package-lock.json" "$BACKEND_DIR/tsconfig.json" "$STAGING_DIR/"
cp -a -- "$BACKEND_DIR/src" "$STAGING_DIR/src"

cat > "$STAGING_DIR/run-checks.sh" <<'CONTAINER_SCRIPT'
#!/usr/bin/env bash
set -euo pipefail

cd /var/task

if [[ "$(uname -m)" != "x86_64" ]]; then
  printf 'FAIL: expected x86_64 image, got %s\n' "$(uname -m)" >&2
  exit 1
fi

. /etc/os-release
if [[ "${ID:-}" != "amzn" || "${VERSION_ID:-}" != 2023* ]]; then
  printf 'FAIL: expected Amazon Linux 2023, got %s %s\n' "${ID:-unknown}" "${VERSION_ID:-unknown}" >&2
  exit 1
fi

node -e 'if (Number(process.versions.node.split(".")[0]) !== 24 || process.arch !== "x64" || process.platform !== "linux") process.exit(1); console.log(`PASS: runtime ${process.version}, ${process.platform}/${process.arch}, Amazon Linux ${process.env.VERSION_ID || "2023"}`)'

# npm ci verifies package.json against the existing lockfile and installs the
# compiler needed for the production build inside the target runtime image.
npm ci
printf '%s\n' 'PASS: npm ci with Backend/package-lock.json'
npm run typecheck
printf '%s\n' 'PASS: npm run typecheck'
npm run build:lambda
test -f dist/lambda.js
printf '%s\n' 'PASS: npm run build:lambda generated dist/lambda.js'

node -e '
  const argon2 = require("argon2");
  (async () => {
    const password = "swiftstash-local-runtime-check";
    const hash = await argon2.hash(password);
    if (!(await argon2.verify(hash, password))) throw new Error("argon2 verification returned false");
    console.log("PASS: argon2 hash and verify");
  })().catch((error) => {
    console.error("FAIL: argon2 hash/verify", error);
    process.exitCode = 1;
  });
'

# Only harmless placeholders are provided. The handler is imported but never
# invoked, so MongoDB, Redis, OAuth, Resend, and AWS are not contacted.
env \
  MONGO_URI='mongodb://127.0.0.1:27017/lambda-runtime-check' \
  ARGON_SECRET='00000000000000000000000000000000' \
  COOKIE_SECRET='00000000000000000000000000000000' \
  GOOGLE_CLIENT_ID='local-runtime-check' \
  GOOGLE_CLIENT_SECRET='local-runtime-check' \
  RESEND_API_KEY='local-runtime-check' \
  AWS_REGION='us-east-1' \
  AWS_BUCKET_NAME='local-runtime-check' \
  REDIS_URL='redis://127.0.0.1:6379' \
  NODE_ENV='test' \
  CORS_ALLOWED_ORIGINS='' \
  node --input-type=module <<'NODE_CHECK'
import assert from "node:assert/strict";
import express from "express";

let listenCalls = 0;
express.application.listen = () => {
  listenCalls += 1;
  throw new Error("Unexpected HTTP listener start during Lambda import");
};

const { handler } = await import("./dist/lambda.js");
assert.equal(typeof handler, "function");
assert.equal(listenCalls, 0);
console.log("PASS: dist/lambda.js imports and exports handler without starting a listener");
NODE_CHECK

# Re-install only production dependencies from the same lockfile and repeat the
# runtime checks against the package's deployment dependency set.
npm ci --omit=dev
printf '%s\n' 'PASS: npm ci --omit=dev with Backend/package-lock.json'
node -e '
  const argon2 = require("argon2");
  (async () => {
    const password = "swiftstash-local-runtime-check";
    const hash = await argon2.hash(password);
    if (!(await argon2.verify(hash, password))) throw new Error("argon2 verification returned false");
    console.log("PASS: production-only argon2 hash and verify");
  })().catch((error) => {
    console.error("FAIL: production-only argon2 hash/verify", error);
    process.exitCode = 1;
  });
'

env \
  MONGO_URI='mongodb://127.0.0.1:27017/lambda-runtime-check' \
  ARGON_SECRET='00000000000000000000000000000000' \
  COOKIE_SECRET='00000000000000000000000000000000' \
  GOOGLE_CLIENT_ID='local-runtime-check' \
  GOOGLE_CLIENT_SECRET='local-runtime-check' \
  RESEND_API_KEY='local-runtime-check' \
  AWS_REGION='us-east-1' \
  AWS_BUCKET_NAME='local-runtime-check' \
  REDIS_URL='redis://127.0.0.1:6379' \
  NODE_ENV='test' \
  CORS_ALLOWED_ORIGINS='' \
  node --input-type=module <<'NODE_CHECK'
import assert from "node:assert/strict";
import express from "express";

let listenCalls = 0;
express.application.listen = () => {
  listenCalls += 1;
  throw new Error("Unexpected HTTP listener start during Lambda import");
};

const { handler } = await import("./dist/lambda.js");
assert.equal(typeof handler, "function");
assert.equal(listenCalls, 0);
console.log("PASS: production dependencies load dist/lambda.js without starting a listener");
NODE_CHECK

printf '%s\n' 'PASS: all AL2023 Lambda compatibility checks completed'
CONTAINER_SCRIPT

chmod +x "$STAGING_DIR/run-checks.sh"

podman run --rm --platform linux/amd64 \
  --volume "$STAGING_DIR:/var/task:Z" \
  --workdir /var/task \
  --entrypoint /bin/bash \
  public.ecr.aws/lambda/nodejs:24 \
  /var/task/run-checks.sh
