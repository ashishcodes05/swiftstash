import initializeMongoDB from "./connectMongoDb.js";
import mongoose from "mongoose";
import redisClient, { initializeRedis } from "./connectRedis.js";
import { initializeRedisIndexes } from "./initializeRedisIndexes.js";

let initializationPromise: Promise<void> | undefined;

export const initializeServices = (): Promise<void> => {
    if (initializationPromise) return initializationPromise;
    if (mongoose.connection.readyState === 1 && redisClient.isReady) {
        return initializeRedisIndexes(redisClient);
    }

    const attempt = (async () => {
        await initializeMongoDB();
        await initializeRedis();
        await initializeRedisIndexes(redisClient);

        if (mongoose.connection.readyState !== 1) {
            throw new Error("MongoDB is not connected after initialization");
        }
        if (!redisClient.isReady) {
            throw new Error("Redis is not ready after initialization");
        }
    })();

    let trackedAttempt: Promise<void>;
    trackedAttempt = attempt.finally(() => {
        if (initializationPromise === trackedAttempt) {
            initializationPromise = undefined;
        }
    });
    initializationPromise = trackedAttempt;
    return trackedAttempt;
};

// Used by the local server only, on startup failure or process shutdown.
export const closeServices = async (): Promise<void> => {
    const shutdowns: Promise<unknown>[] = [mongoose.disconnect()];
    if (redisClient.isOpen) shutdowns.push(redisClient.close());

    const results = await Promise.allSettled(shutdowns);
    const failure = results.find((result) => result.status === "rejected");
    if (failure?.status === "rejected") throw failure.reason;
};
