import mongoose from "mongoose";
import { env } from './env.js';

let connectionPromise: Promise<typeof mongoose> | undefined;
let hasConnectedBefore = mongoose.connection.readyState === 1;

mongoose.connection.on('connected', () => {
    hasConnectedBefore = true;
});

mongoose.connection.on('close', () => {
    hasConnectedBefore = false;
});

const MONGO_RECOVERY_TIMEOUT_MS = 15_000;

const waitForMongoRecovery = (): Promise<typeof mongoose> => {
    const client = mongoose.connection.getClient();

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => finish(new Error(`MongoDB did not become ready within ${MONGO_RECOVERY_TIMEOUT_MS}ms`)), MONGO_RECOVERY_TIMEOUT_MS);

        const cleanup = () => {
            clearTimeout(timeout);
            mongoose.connection.off('connected', onConnected);
            mongoose.connection.off('close', onClose);
            client.off('serverHeartbeatSucceeded', onHeartbeatSucceeded);
        };

        const finish = (error?: Error) => {
            cleanup();
            if (error) reject(error);
            else resolve(mongoose);
        };

        const onConnected = () => {
            if (mongoose.connection.readyState === 1) finish();
        };
        const onHeartbeatSucceeded = () => onConnected();
        const onClose = () => finish(new Error('MongoDB connection closed during recovery'));

        mongoose.connection.on('connected', onConnected);
        mongoose.connection.once('close', onClose);
        client.on('serverHeartbeatSucceeded', onHeartbeatSucceeded);

        if (mongoose.connection.readyState === 1) onConnected();
    });
};

const initializeMongoDB = (): Promise<typeof mongoose> => {
    if (mongoose.connection.readyState === 1) {
        return Promise.resolve(mongoose);
    }

    if (connectionPromise) return connectionPromise;

    let attempt: Promise<typeof mongoose>;
    let waitingForRecovery = false;
    if (hasConnectedBefore) {
        try {
            attempt = waitForMongoRecovery();
            waitingForRecovery = true;
        } catch {
            attempt = mongoose.connect(env.MONGO_URI);
        }
    } else {
        attempt = mongoose.connect(env.MONGO_URI);
    }

    attempt = attempt.then((connection) => {
        console.log(`Connected to ${mongoose.connection.name} database`);
        return connection;
    })
        .catch((error: unknown) => {
            if (waitingForRecovery && mongoose.connection.readyState === 0 && !hasConnectedBefore) {
                // A terminal close happened while waiting for Mongoose's driver recovery.
                return mongoose.connect(env.MONGO_URI).then((connection) => {
                    console.log(`Connected to ${mongoose.connection.name} database`);
                    return connection;
                });
            }
            console.error('Error connecting to MongoDB:', error);
            throw error;
        });

    let trackedAttempt: Promise<typeof mongoose>;
    trackedAttempt = attempt.finally(() => {
        if (connectionPromise === trackedAttempt) {
            connectionPromise = undefined;
        }
    });
    connectionPromise = trackedAttempt;

    return trackedAttempt;
};

export default initializeMongoDB;
