import assert from "node:assert/strict";
import test from "node:test";

const { initializeRedisIndexes } = await import("../src/config/initializeRedisIndexes.ts");

const compatibleInfo = () => ({
  index_name: "sessionIdx",
  index_definition: {
    key_type: "JSON",
    prefixes: ["swiftstash:session:"],
  },
  attributes: [
    { identifier: "$.userId", attribute: "userId", type: "TAG", flags: [] },
    { identifier: "$.createdAt", attribute: "createdAt", type: "TEXT", flags: ["SORTABLE"] },
  ],
});

const fakeClient = ({ info, create } = {}) => ({
  ft: {
    info: info ?? (async () => compatibleInfo()),
    create: create ?? (async () => "OK"),
  },
});

test("creates the session index when missing using the expected JSON schema", async () => {
  let infoCalls = 0;
  let created;
  const client = fakeClient({
    info: async () => {
      infoCalls += 1;
      if (infoCalls === 1) throw new Error("SEARCH_INDEX_NOT_FOUND Index not found: sessionIdx");
      return compatibleInfo();
    },
    create: async (...args) => { created = args; return "OK"; },
  });

  await initializeRedisIndexes(client);

  assert.equal(created[0], "sessionIdx");
  assert.deepEqual(created[1], {
    "$.userId": { type: "TAG", AS: "userId" },
    "$.createdAt": { type: "TEXT", AS: "createdAt", SORTABLE: true },
  });
  assert.deepEqual(created[2], { ON: "JSON", PREFIX: "swiftstash:session:" });
  assert.equal(infoCalls, 2);
});

test("reuses an existing compatible index", async () => {
  let createCalls = 0;
  const client = fakeClient({ create: async () => { createCalls += 1; return "OK"; } });

  await initializeRedisIndexes(client);

  assert.equal(createCalls, 0);
});

test("validates RESP3 map-shaped FT.INFO replies", async () => {
  const info = compatibleInfo();
  const client = fakeClient({
    info: async () => new Map([
      ["index_name", info.index_name],
      ["index_definition", new Map(Object.entries(info.index_definition))],
      ["attributes", info.attributes.map((attribute) => new Map(Object.entries(attribute)))],
    ]),
  });

  await initializeRedisIndexes(client);
});

test("rejects an existing incompatible index without replacing it", async () => {
  let createCalls = 0;
  const client = fakeClient({
    info: async () => ({
      ...compatibleInfo(),
      index_definition: { key_type: "JSON", prefixes: ["other:"] },
    }),
    create: async () => { createCalls += 1; return "OK"; },
  });

  await assert.rejects(initializeRedisIndexes(client), /incompatible schema.*prefix/i);
  assert.equal(createCalls, 0);
});

test("shares concurrent initialization and tolerates a competing creator", async () => {
  let infoCalls = 0;
  let createCalls = 0;
  let releaseFirstInfo;
  const firstInfo = new Promise((resolve) => { releaseFirstInfo = resolve; });
  const client = fakeClient({
    info: async () => {
      infoCalls += 1;
      if (infoCalls === 1) {
        await firstInfo;
        throw new Error("Unknown Index name");
      }
      return compatibleInfo();
    },
    create: async () => {
      createCalls += 1;
      throw new Error("Index already exists");
    },
  });

  const first = initializeRedisIndexes(client);
  const second = initializeRedisIndexes(client);
  releaseFirstInfo();
  await Promise.all([first, second]);

  assert.equal(infoCalls, 2);
  assert.equal(createCalls, 1);
});

test("propagates Redis errors and allows a later retry", async () => {
  let calls = 0;
  const client = fakeClient({
    info: async () => {
      calls += 1;
      if (calls === 1) throw new Error("ECONNREFUSED");
      return compatibleInfo();
    },
  });

  await assert.rejects(initializeRedisIndexes(client), /ECONNREFUSED/);
  await initializeRedisIndexes(client);
  assert.equal(calls, 2);
});
