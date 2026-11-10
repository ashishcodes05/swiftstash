import { createClient } from "redis";
import { env } from "./env.js";

const redisClient = createClient({ url: env.REDIS_URL });

const REDIS_READY_TIMEOUT_MS = 10_000;
let connectionAttempt: Promise<void> | undefined;
let readinessAttempt: Promise<void> | undefined;

redisClient.on("error", (err) => {
    console.log("Error in connecting to Redis", err);
})

redisClient.on("ready", () => {
    console.log("Connected to Redis database");
});

const startConnection = (): Promise<void> => {
    if (connectionAttempt) return connectionAttempt;

    const attempt = redisClient.connect().then(() => undefined);
    let trackedAttempt: Promise<void>;
    trackedAttempt = attempt.finally(() => {
        if (connectionAttempt === trackedAttempt) {
            connectionAttempt = undefined;
        }
    });
    connectionAttempt = trackedAttempt;
    return trackedAttempt;
};

const waitForReconnect = (): Promise<void> => new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => finish(new Error(`Redis did not become ready within ${REDIS_READY_TIMEOUT_MS}ms`)), REDIS_READY_TIMEOUT_MS);

    const cleanup = () => {
        clearTimeout(timeout);
        redisClient.off("ready", onReady);
        redisClient.off("end", onEnd);
    };

    const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (error) reject(error);
        else resolve();
    };

    const onReady = () => {
        if (redisClient.isReady) finish();
    };
    const onEnd = () => finish(new Error("Redis client closed before becoming ready"));

    redisClient.once("ready", onReady);
    redisClient.once("end", onEnd);

    if (redisClient.isReady) finish();
    else if (!redisClient.isOpen) onEnd();
});

const waitWithTimeout = (promise: Promise<void>): Promise<void> => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Redis did not become ready within ${REDIS_READY_TIMEOUT_MS}ms`)), REDIS_READY_TIMEOUT_MS);
    promise.then(
        () => {
            clearTimeout(timeout);
            resolve();
        },
        (error: unknown) => {
            clearTimeout(timeout);
            reject(error);
        },
    );
});

const waitUntilReady = async (): Promise<void> => {
    if (redisClient.isReady) return;

    if (redisClient.isOpen) {
        await waitWithTimeout(connectionAttempt ?? waitForReconnect());
    } else {
        await waitWithTimeout(startConnection());
    }

    if (!redisClient.isReady) {
        throw new Error("Redis connection completed without entering the ready state");
    }
};

export const initializeRedis = (): Promise<void> => {
    if (redisClient.isReady) return Promise.resolve();
    if (readinessAttempt) return readinessAttempt;

    let trackedAttempt: Promise<void>;
    trackedAttempt = waitUntilReady().finally(() => {
        if (readinessAttempt === trackedAttempt) {
            readinessAttempt = undefined;
        }
    });
    readinessAttempt = trackedAttempt;
    return trackedAttempt;
};

export default redisClient;
