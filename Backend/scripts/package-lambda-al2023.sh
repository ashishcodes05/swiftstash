#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_PATH="${BASH_SOURCE[0]}"
case "$SCRIPT_PATH" in
  /*) ;;
  *) SCRIPT_PATH="$PWD/$SCRIPT_PATH" ;;
esac
SCRIPT_DIR="${SCRIPT_PATH%/*}"
BACKEND_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
DEPLOYMENT_DIR="$BACKEND_DIR/deployment"

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

OUTPUT_FILENAME="${LAMBDA_ZIP_FILENAME:-swiftstash-backend.zip}"
[[ "$OUTPUT_FILENAME" =~ ^[A-Za-z0-9._-]+\.zip$ ]] || fail "invalid ZIP filename"
OUTPUT_ZIP="$DEPLOYMENT_DIR/$OUTPUT_FILENAME"

command -v podman >/dev/null 2>&1 || fail 'Podman is not installed'
command -v node >/dev/null 2>&1 || fail 'Node.js is required on the host to stage and inspect the package'
[[ ! -e "$OUTPUT_ZIP" ]] || fail "refusing to overwrite existing artifact: $OUTPUT_ZIP"

ROOTLESS="$(podman info --format '{{.Host.Security.Rootless}}')" || fail 'rootless Podman is unavailable in this user session'
[[ "$ROOTLESS" == true ]] || fail 'Podman is not running rootless; refusing to continue'

STAGING_DIR="$(node -e 'const fs=require("node:fs");const os=require("node:os");const path=require("node:path");process.stdout.write(fs.mkdtempSync(path.join(process.env.TMPDIR||os.tmpdir(),"swiftstash-lambda-package-")))')"
cleanup() {
  local exit_status=$?
  node -e 'require("node:fs").rmSync(process.argv[1],{recursive:true,force:true})' "$STAGING_DIR" || true
  exit "$exit_status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Copy only the locked Backend build inputs and TypeScript source. No .env,
# node_modules, tests, Git data, Frontend, Landing, or other repository files
# are staged.
node --input-type=module - "$BACKEND_DIR" "$STAGING_DIR" <<'NODE_STAGE'
import fs from "node:fs";
import path from "node:path";

const [backendDir, stagingDir] = process.argv.slice(2);
const forbiddenName = (name) => /^\.env(?:$|\.)/i.test(name)
  || /^(?:\.npmrc|\.yarnrc|\.pypirc|id_rsa|id_ed25519|secrets\.json|credentials\.json)$/i.test(name)
  || /\.(?:pem|key|p12|pfx)$/i.test(name);
function inspectTree(directory, relativeRoot) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    const relativePath = path.join(relativeRoot, entry.name);
    if (forbiddenName(entry.name)) throw new Error(`forbidden secret-like input: ${relativePath}`);
    if (entry.isSymbolicLink()) throw new Error(`symbolic link is not allowed in staging inputs: ${relativePath}`);
    if (entry.isDirectory()) inspectTree(fullPath, relativePath);
  }
}
inspectTree(path.join(backendDir, "src"), "src");
for (const file of ["package.json", "package-lock.json", "tsconfig.json"]) {
  const source = path.join(backendDir, file);
  const metadata = fs.lstatSync(source);
  if (forbiddenName(file) || !metadata.isFile() || metadata.isSymbolicLink()) throw new Error(`unexpected build input: ${file}`);
}

for (const file of ["package.json", "package-lock.json", "tsconfig.json"]) {
  fs.copyFileSync(path.join(backendDir, file), path.join(stagingDir, file), fs.constants.COPYFILE_EXCL);
}
fs.cpSync(path.join(backendDir, "src"), path.join(stagingDir, "src"), { recursive: true, errorOnExist: true });
inspectTree(stagingDir, "staging");
console.log("PASS: staging contains no .env or secret-named files");
NODE_STAGE

CONTAINER_SCRIPT=''
IFS= read -r -d '' CONTAINER_SCRIPT <<'CONTAINER_SCRIPT' || true
#!/usr/bin/env bash
set -Eeuo pipefail

cd /var/task

node --input-type=module <<'NODE_RUNTIME'
import fs from "node:fs";
const osRelease = Object.fromEntries(fs.readFileSync("/etc/os-release", "utf8")
  .split(/\r?\n/)
  .filter((line) => /^[A-Z_]+=/.test(line))
  .map((line) => {
    const separator = line.indexOf("=");
    return [line.slice(0, separator), line.slice(separator + 1).replace(/^"(.*)"$/, "$1")];
  }));
if (osRelease.ID !== "amzn" || osRelease.VERSION_ID !== "2023") {
  throw new Error(`Expected ID=amzn and VERSION_ID=2023; got ID=${osRelease.ID ?? "unknown"}, VERSION_ID=${osRelease.VERSION_ID ?? "unknown"}`);
}
if (Number(process.versions.node.split(".")[0]) !== 24 || process.arch !== "x64" || process.platform !== "linux") {
  throw new Error(`Expected Node.js 24 linux/x64; got ${process.version} ${process.platform}/${process.arch}`);
}
console.log(`PASS: Node ${process.version}, ${process.platform}/${process.arch}, Amazon Linux ${osRelease.VERSION_ID}`);
NODE_RUNTIME

set_test_environment() {
  export MONGO_URI='mongodb://127.0.0.1:27017/lambda-runtime-check'
  export ARGON_SECRET='00000000000000000000000000000000'
  export COOKIE_SECRET='00000000000000000000000000000000'
  export GOOGLE_CLIENT_ID='local-runtime-check'
  export GOOGLE_CLIENT_SECRET='local-runtime-check'
  export RESEND_API_KEY='local-runtime-check'
  export AWS_REGION='us-east-1'
  export AWS_BUCKET_NAME='local-runtime-check'
  export REDIS_URL='redis://127.0.0.1:6379'
  export NODE_ENV='test'
  export CORS_ALLOWED_ORIGINS=''
}

check_argon2() {
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
}

check_lambda_import() {
  set_test_environment
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
console.log("PASS: Lambda handler imports without starting an HTTP listener");
NODE_CHECK
}

# Install the lockfile-defined build tree, compile, and run the initial smoke
# tests in the target runtime image.
npm ci
printf '%s\n' 'PASS: npm ci from package-lock.json'
npm run typecheck
printf '%s\n' 'PASS: npm run typecheck'
npm run build:lambda
[[ -f dist/lambda.js ]] || { printf '%s\n' 'FAIL: dist/lambda.js was not generated' >&2; exit 1; }
printf '%s\n' 'PASS: npm run build:lambda generated dist/lambda.js'
check_argon2
check_lambda_import

# Replace the full tree with production dependencies only and repeat the
# required runtime checks before creating the deployment tree or ZIP.
npm ci --omit=dev
printf '%s\n' 'PASS: npm ci --omit=dev from package-lock.json'
check_argon2
check_lambda_import

node --input-type=module <<'NODE_PACKAGE'
import fs from "node:fs";
import path from "node:path";

for (const tool of ["typescript", "tsx", "esbuild"]) {
  if (fs.existsSync(path.join("node_modules", tool))) throw new Error(`Development dependency remains installed: ${tool}`);
}

const packageRoot = path.resolve(".lambda-package");
fs.rmSync(packageRoot, { recursive: true, force: true });
fs.mkdirSync(packageRoot, { recursive: true });
fs.cpSync("dist", path.join(packageRoot, "dist"), { recursive: true, errorOnExist: true });
fs.cpSync("node_modules", path.join(packageRoot, "node_modules"), { recursive: true, errorOnExist: true, dereference: false });
// npm's .bin links are build-time CLI shims and are unnecessary at Lambda runtime.
fs.rmSync(path.join(packageRoot, "node_modules", ".bin"), { recursive: true, force: true });

const forbiddenName = (name) => /^\.env(?:$|\.)/i.test(name)
  || /^(?:\.npmrc|\.yarnrc|\.pypirc|id_rsa|id_ed25519|secrets\.json|credentials\.json)$/i.test(name)
  || /\.(?:pem|key|p12|pfx)$/i.test(name);
const testDirectoryNames = new Set(["test", "tests", "__tests__", "__fixtures__", "fixtures"]);
function pruneAndInspect(directory, insideNodeModules = false) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (forbiddenName(entry.name)) throw new Error(`Forbidden secret-like file in deployment tree: ${path.relative(packageRoot, fullPath)}`);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic link is not allowed in deployment tree: ${path.relative(packageRoot, fullPath)}`);
    if (entry.isDirectory()) {
      if (insideNodeModules && testDirectoryNames.has(entry.name.toLowerCase())) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        continue;
      }
      pruneAndInspect(fullPath, insideNodeModules || entry.name === "node_modules");
      continue;
    }
    if (entry.isFile() && (/\.map$/i.test(entry.name) || /\.d\.ts$/i.test(entry.name))) fs.unlinkSync(fullPath);
  }
}
pruneAndInspect(packageRoot);
fs.rmSync(path.join(packageRoot, "node_modules", ".package-lock.json"), { force: true });

const source = JSON.parse(fs.readFileSync("package.json", "utf8"));
const runtimeManifest = {
  name: source.name,
  version: source.version,
  type: "module",
  main: "dist/lambda.js",
  dependencies: source.dependencies,
};
fs.writeFileSync(path.join(packageRoot, "package.json"), `${JSON.stringify(runtimeManifest, null, 2)}\n`, { flag: "wx" });

if (!fs.existsSync(path.join(packageRoot, "dist", "lambda.js"))) throw new Error("Deployment tree is missing dist/lambda.js");
console.log("PASS: production-only deployment tree assembled; .env, test directories, maps, and declarations excluded");
NODE_PACKAGE

# Test the exact pruned deployment tree before creating any ZIP.
cd /var/task/.lambda-package
check_argon2
check_lambda_import
cd /var/task

# Archiver is already a production dependency. Use its file API with a Node
# filesystem walk (not glob/directory helpers) to create and inspect the ZIP.
node --input-type=module <<'NODE_ARCHIVE'
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ZipArchive } from "archiver";

const packageRoot = path.resolve(".lambda-package");
const zipPath = path.resolve("swiftstash-backend.zip");
const forbiddenName = (name) => /^\.env(?:$|\.)/i.test(name)
  || /^(?:\.npmrc|\.yarnrc|\.pypirc|id_rsa|id_ed25519|secrets\.json|credentials\.json)$/i.test(name)
  || /\.(?:pem|key|p12|pfx)$/i.test(name);
const files = [];
function collectFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    const relativePath = path.relative(packageRoot, fullPath).split(path.sep).join("/");
    if (forbiddenName(entry.name)) throw new Error(`Forbidden secret-like file in ZIP input: ${relativePath}`);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic link is not allowed in ZIP input: ${relativePath}`);
    if (entry.isDirectory()) collectFiles(fullPath);
    else if (entry.isFile()) {
      if (/\.(?:map|d\.ts)$/i.test(entry.name)) throw new Error(`Source map/declaration remains in ZIP input: ${relativePath}`);
      files.push({ fullPath, relativePath });
    }
  }
}
collectFiles(packageRoot);
assert(files.some((file) => file.relativePath === "dist/lambda.js"), "dist/lambda.js is missing");
assert(files.some((file) => file.relativePath === "package.json"), "root package.json is missing");
const nativeArgonPath = "node_modules/argon2/prebuilds/linux-x64/argon2.glibc.node";
const nativeArgon = files.find((file) => file.relativePath === nativeArgonPath);
assert(nativeArgon, `required Linux x64 glibc Argon2 binary is missing: ${nativeArgonPath}`);
const elf = fs.readFileSync(nativeArgon.fullPath);
assert(elf.length >= 20, "Argon2 native binary has a truncated ELF header");
assert(elf.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46])), "Argon2 native binary is not ELF");
assert.equal(elf[4], 2, "Argon2 native binary is not ELF64");
assert.equal(elf[5], 1, "Argon2 native binary is not little-endian ELF");
assert.equal(elf.readUInt16LE(18), 62, "Argon2 native binary is not x86_64");

const output = fs.createWriteStream(zipPath, { flags: "wx" });
const archive = new ZipArchive({ zlib: { level: 9 } });
const finished = new Promise((resolve, reject) => {
  output.once("close", resolve);
  output.once("error", reject);
  archive.once("error", reject);
});
archive.pipe(output);
for (const file of files) archive.file(file.fullPath, { name: file.relativePath });
await archive.finalize();
await finished;

const archiveSize = fs.statSync(zipPath).size;
const fd = fs.openSync(zipPath, "r");
try {
  const tailLength = Math.min(archiveSize, 22 + 0xffff);
  const tail = Buffer.alloc(tailLength);
  fs.readSync(fd, tail, 0, tailLength, archiveSize - tailLength);
  let eocd = -1;
  for (let offset = tail.length - 22; offset >= 0; offset -= 1) {
    if (tail.readUInt32LE(offset) === 0x06054b50 && offset + 22 + tail.readUInt16LE(offset + 20) === tail.length) {
      eocd = offset;
      break;
    }
  }
  assert(eocd >= 0, "ZIP end-of-central-directory record is missing");
  const count = tail.readUInt16LE(eocd + 10);
  const centralSize = tail.readUInt32LE(eocd + 12);
  const centralOffset = tail.readUInt32LE(eocd + 16);
  assert(count !== 0xffff && centralSize !== 0xffffffff && centralOffset !== 0xffffffff, "ZIP64 archive is not supported by this inspector");
  assert(centralOffset + centralSize <= archiveSize, "ZIP central directory is out of bounds");

  const entries = [];
  let cursor = centralOffset;
  let uncompressedSize = 0;
  for (let index = 0; index < count; index += 1) {
    const header = Buffer.alloc(46);
    assert.equal(fs.readSync(fd, header, 0, header.length, cursor), header.length, "incomplete central directory header");
    assert.equal(header.readUInt32LE(0), 0x02014b50, "invalid central directory header signature");
    const nameLength = header.readUInt16LE(28);
    const extraLength = header.readUInt16LE(30);
    const commentLength = header.readUInt16LE(32);
    const uncompressed = header.readUInt32LE(24);
    assert.notEqual(uncompressed, 0xffffffff, "ZIP64 entry is not supported by this inspector");
    const nameBuffer = Buffer.alloc(nameLength);
    fs.readSync(fd, nameBuffer, 0, nameLength, cursor + header.length);
    const name = nameBuffer.toString("utf8");
    assert(!name.startsWith("/") && !name.split("/").includes(".."), `unsafe ZIP path: ${name}`);
    if (forbiddenName(path.posix.basename(name))) throw new Error(`Forbidden secret-like path in ZIP: ${name}`);
    assert(!/\.(?:map|d\.ts)$/i.test(name), `source map/declaration in ZIP: ${name}`);
    const firstSegment = name.split("/")[0];
    assert(["dist", "node_modules", "package.json"].includes(firstSegment), `unexpected ZIP root entry: ${name}`);
    entries.push(name);
    uncompressedSize += uncompressed;
    cursor += header.length + nameLength + extraLength + commentLength;
  }
  assert.equal(cursor, centralOffset + centralSize, "central directory size mismatch");
  assert(entries.includes("dist/lambda.js"), "ZIP is missing dist/lambda.js");
  assert(entries.includes("package.json"), "ZIP is missing root package.json");
  assert(entries.includes(nativeArgonPath), `ZIP is missing ${nativeArgonPath}`);

  console.log("ZIP contents:");
  for (const entry of entries) console.log(entry);
  console.log(`Argon2 native module included: ${nativeArgonPath}`);
  console.log(`Compressed ZIP size: ${archiveSize.toLocaleString()} bytes (${(archiveSize / (1024 * 1024)).toFixed(2)} MiB)`);
  console.log(`Uncompressed ZIP file size: ${uncompressedSize.toLocaleString()} bytes (${(uncompressedSize / (1024 * 1024)).toFixed(2)} MiB)`);
  console.log("PASS: ZIP structure and safety checks");
} finally {
  fs.closeSync(fd);
}
NODE_ARCHIVE

printf '%s\n' 'PASS: all AL2023 build and runtime checks completed; ZIP is ready for host-side promotion'
CONTAINER_SCRIPT

printf '%s' "$CONTAINER_SCRIPT" | node -e 'require("node:fs").writeFileSync(process.argv[1],require("node:fs").readFileSync(0))' "$STAGING_DIR/build-and-package.sh"

podman run --rm --platform linux/amd64 \
  --volume "$STAGING_DIR:/var/task:Z" \
  --workdir /var/task \
  --entrypoint /bin/bash \
  public.ecr.aws/lambda/nodejs:24 \
  /var/task/build-and-package.sh

# Promote only a ZIP that the container created after every smoke test and
# archive inspection succeeded. COPYFILE_EXCL prevents overwriting an artifact.
node --input-type=module - "$STAGING_DIR" "$OUTPUT_ZIP" <<'NODE_PROMOTE'
import fs from "node:fs";
import path from "node:path";

const [stagingDir, outputZip] = process.argv.slice(2);
const stagedZip = path.join(stagingDir, "swiftstash-backend.zip");
if (!fs.statSync(stagedZip).isFile()) throw new Error("AL2023 container did not produce the inspected ZIP");
const outputDirectory = path.dirname(outputZip);
fs.mkdirSync(outputDirectory, { recursive: true });
const promotionDirectory = fs.mkdtempSync(path.join(outputDirectory, ".swiftstash-backend-promotion-"));
const temporaryOutput = path.join(promotionDirectory, "swiftstash-backend.zip");
try {
  fs.copyFileSync(stagedZip, temporaryOutput, fs.constants.COPYFILE_EXCL);
  fs.linkSync(temporaryOutput, outputZip);
} finally {
  fs.rmSync(promotionDirectory, { recursive: true, force: true });
}
console.log(`Artifact: ${outputZip}`);
console.log("Lambda handler: dist/lambda.handler");
NODE_PROMOTE
