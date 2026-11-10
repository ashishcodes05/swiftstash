import assert from "node:assert/strict";
import test from "node:test";

const originalLog = console.log;
console.log = () => {};
let mongoose;
let OAuthService;
let UserRepository;
let DirectoryRepository;
let SessionRepository;
try {
  ({ default: mongoose } = await import("mongoose"));
  ({ OAuthService } = await import("../src/modules/auth/oauth.service.ts"));
  ({ UserRepository } = await import("../src/modules/user/user.repository.ts"));
  ({ DirectoryRepository } = await import("../src/modules/directory/directory.repository.ts"));
  ({ SessionRepository } = await import("../src/modules/auth/session.repository.ts"));
} finally {
  console.log = originalLog;
}

const createSessionMock = () => {
  const state = { active: false, commits: 0, aborts: 0, ends: 0 };
  const session = {
    startTransaction() { state.active = true; },
    async commitTransaction() { state.commits += 1; state.active = false; },
    inTransaction() { return state.active; },
    async abortTransaction() {
      if (!state.active) throw new Error("abortTransaction called outside active transaction");
      state.aborts += 1;
      state.active = false;
    },
    async endSession() { state.ends += 1; },
  };
  return { session, state };
};

const withOAuthMocks = async ({ failAt, postCommitError } = {}, run) => {
  const transaction = createSessionMock();
  const originals = {
    startSession: mongoose.startSession,
    findByEmail: UserRepository.findByEmail,
    createUser: UserRepository.createUser,
    createDirectory: DirectoryRepository.createDirectory,
    enforceDeviceLimit: SessionRepository.enforceDeviceLimit,
    createSession: SessionRepository.createSession,
  };
  let createdUserId;
  let calls = { enforceDeviceLimit: 0, createSession: 0, enforcedUserId: undefined, sessionUserId: undefined };
  const underlyingError = new Error("sentinel operation failure");

  mongoose.startSession = async () => transaction.session;
  UserRepository.findByEmail = async () => null;
  UserRepository.createUser = async (userData) => { createdUserId = userData._id.toString(); };
  DirectoryRepository.createDirectory = async () => {
    if (failAt === "before-commit") throw underlyingError;
  };
  SessionRepository.enforceDeviceLimit = async (userId) => {
    calls.enforceDeviceLimit += 1;
    calls.enforcedUserId = userId;
    if (postCommitError) throw underlyingError;
  };
  SessionRepository.createSession = async (userId) => {
    calls.createSession += 1;
    calls.sessionUserId = userId;
    return "mock-session-id";
  };

  try {
    await run({ transaction, calls, get createdUserId() { return createdUserId; }, underlyingError });
  } finally {
    mongoose.startSession = originals.startSession;
    UserRepository.findByEmail = originals.findByEmail;
    UserRepository.createUser = originals.createUser;
    DirectoryRepository.createDirectory = originals.createDirectory;
    SessionRepository.enforceDeviceLimit = originals.enforceDeviceLimit;
    SessionRepository.createSession = originals.createSession;
  }
};

test("commits creation, creates the Redis session for that user, and ends the session once", async () => {
  await withOAuthMocks({}, async (context) => {
    const { transaction, calls } = context;
    const sessionId = await OAuthService.handleLogin("Test User", "test@example.invalid", "https://example.invalid/picture");

    assert.equal(sessionId, "mock-session-id");
    assert.ok(context.createdUserId);
    assert.equal(calls.enforceDeviceLimit, 1);
    assert.equal(calls.createSession, 1);
    assert.equal(calls.enforcedUserId, context.createdUserId);
    assert.equal(calls.sessionUserId, context.createdUserId);
    assert.equal(transaction.state.commits, 1);
    assert.equal(transaction.state.aborts, 0);
    assert.equal(transaction.state.ends, 1);
  });
});

test("aborts a failure before commit and preserves the original error", async () => {
  await withOAuthMocks({ failAt: "before-commit" }, async ({ transaction, underlyingError }) => {
    let caught;
    try {
      await OAuthService.handleLogin("Test User", "test@example.invalid", "https://example.invalid/picture");
    } catch (error) {
      caught = error;
    }

    assert.equal(caught, underlyingError);
    assert.equal(transaction.state.commits, 0);
    assert.equal(transaction.state.aborts, 1);
    assert.equal(transaction.state.ends, 1);
  });
});

test("preserves post-commit session errors without aborting the committed transaction", async () => {
  await withOAuthMocks({ postCommitError: true }, async ({ transaction, underlyingError }) => {
    let caught;
    try {
      await OAuthService.handleLogin("Test User", "test@example.invalid", "https://example.invalid/picture");
    } catch (error) {
      caught = error;
    }

    assert.equal(caught, underlyingError);
    assert.equal(transaction.state.commits, 1);
    assert.equal(transaction.state.aborts, 0);
    assert.equal(transaction.state.ends, 1);
  });
});

test("does not abort after a commit error that ended the transaction", async () => {
  const originals = {
    startSession: mongoose.startSession,
    findByEmail: UserRepository.findByEmail,
    createUser: UserRepository.createUser,
    createDirectory: DirectoryRepository.createDirectory,
  };
  const underlyingError = new Error("sentinel commit failure");
  const state = { active: false, aborts: 0, ends: 0 };
  const session = {
    startTransaction() { state.active = true; },
    async commitTransaction() { state.active = false; throw underlyingError; },
    inTransaction() { return state.active; },
    async abortTransaction() { state.aborts += 1; throw new Error("must not abort ended transaction"); },
    async endSession() { state.ends += 1; },
  };

  mongoose.startSession = async () => session;
  UserRepository.findByEmail = async () => null;
  UserRepository.createUser = async () => {};
  DirectoryRepository.createDirectory = async () => {};
  try {
    let caught;
    try {
      await OAuthService.handleLogin("Test User", "test@example.invalid", "https://example.invalid/picture");
    } catch (error) {
      caught = error;
    }
    assert.equal(caught, underlyingError);
    assert.equal(state.aborts, 0);
    assert.equal(state.ends, 1);
  } finally {
    mongoose.startSession = originals.startSession;
    UserRepository.findByEmail = originals.findByEmail;
    UserRepository.createUser = originals.createUser;
    DirectoryRepository.createDirectory = originals.createDirectory;
  }
});
